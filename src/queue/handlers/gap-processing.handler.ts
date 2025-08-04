/**
 * Gap Processing Handler
 * ---------------------------------
 * Handler for processing blockchain transaction gaps
 */
import { Job } from 'bullmq';
import Bottleneck from 'bottleneck';

import { GapProcessingJobData, JobProgress } from '../types';

import { JOB_CONFIG } from '../config';
import logger from '../../config/logger';
import { queueGapsForProcessing } from '../client';
import { processTransactionGap } from '../../modules/eth/tx/v1/tx.service';

// Etherscan API rate limiter: 5 requests per second
const etherscanLimiter = new Bottleneck({
  reservoir: 5, // Initial number of requests
  reservoirRefreshAmount: 5, // Number of requests to add
  reservoirRefreshInterval: 1000, // Refresh every 1 second (1000ms)
  maxConcurrent: 1, // Only 1 request at a time to ensure proper rate limiting
});

/**
 * Check if error is an Etherscan query timeout
 */
function isEtherscanTimeoutError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('query timeout') &&
    errorMessage.includes('please select a smaller result dataset')
  );
}

/**
 * Split a block range into smaller chunks for re-queuing
 */
function createSmallerChunks(
  address: string,
  fromBlock: number,
  toBlock: number,
  chunkSize: number = 1000
): Array<{ fromBlock: number; toBlock: number }> {
  const chunks: Array<{ fromBlock: number; toBlock: number }> = [];
  let currentFromBlock = fromBlock;

  while (currentFromBlock <= toBlock) {
    const currentToBlock = Math.min(currentFromBlock + chunkSize - 1, toBlock);
    chunks.push({
      fromBlock: currentFromBlock,
      toBlock: currentToBlock,
    });
    currentFromBlock = currentToBlock + 1;
  }

  logger.info('Created smaller chunks for timeout recovery', {
    address,
    originalRange: `${fromBlock}-${toBlock}`,
    chunkSize,
    chunksCreated: chunks.length,
    chunks: chunks.map((c) => `${c.fromBlock}-${c.toBlock}`),
  });

  return chunks;
}

/**
 * Process a single gap processing job
 */
export async function handleGapProcessingJob(
  job: Job<GapProcessingJobData>
): Promise<void> {
  const { address, fromBlock, toBlock, totalJobs, currentJob } = job.data;

  logger.info('Processing gap job', {
    jobId: job.id,
    address,
    fromBlock,
    toBlock,
    currentJob,
    totalJobs,
    progress: `${currentJob}/${totalJobs}`,
  });

  try {
    // Update job progress
    await job.updateProgress({
      phase: 'fetching',
      page: 1,
      totalPages: '?',
      progress: `${currentJob}/${totalJobs}`,
    } as JobProgress);

    // Use the business logic from tx.service with rate limiting
    const result = await etherscanLimiter.schedule(() =>
      processTransactionGap(
        address,
        fromBlock,
        toBlock,
        JOB_CONFIG.GAP_PROCESSING.MAX_TRANSACTIONS_PER_BATCH,
        (progress) => job.updateProgress(progress)
      )
    );

    // Final progress update
    await job.updateProgress({
      phase: 'saving',
      transactions: result.transactionCount,
      progress: `${currentJob}/${totalJobs}`,
    } as JobProgress);

    logger.info('Gap job completed successfully', {
      jobId: job.id,
      address,
      fromBlock,
      toBlock,
      transactionCount: result.transactionCount,
      iterations: result.pages,
      processedRange: `${result.processedFromBlock}-${result.processedToBlock}`,
      partialRange: result.partialRange,
      progress: `${currentJob}/${totalJobs}`,
    });

    // If we only processed a partial range due to Etherscan's 10k limit,
    // we should log this for potential follow-up processing
    if (result.partialRange) {
      const remainingFromBlock = result.processedToBlock + 1;
      const remainingToBlock = toBlock;

      logger.warn('Partial range processed due to Etherscan limit', {
        jobId: job.id,
        address,
        originalRange: `${fromBlock}-${toBlock}`,
        processedRange: `${result.processedFromBlock}-${result.processedToBlock}`,
        remainingRange: `${remainingFromBlock}-${remainingToBlock}`,
        transactionCount: result.transactionCount,
        note: 'Remaining range may need separate processing',
      });

      // TODO: Consider auto-queuing the remaining range as a new job
      // This would require access to the queue client and careful handling
      // to avoid infinite loops in case of addresses with massive transaction counts
    }
  } catch (error) {
    if (isEtherscanTimeoutError(error as Error)) {
      logger.error(
        'Etherscan query timeout detected, splitting into smaller chunks',
        {
          jobId: job.id,
          address,
          fromBlock,
          toBlock,
          error: (error as Error).message,
        }
      );

      try {
        const chunks = createSmallerChunks(address, fromBlock, toBlock);

        // Convert chunks to Gap format for queueGapsForProcessing
        const gaps = chunks.map((chunk) => ({
          fromBlock: chunk.fromBlock,
          toBlock: chunk.toBlock,
        }));

        await queueGapsForProcessing(address, gaps);

        logger.info(
          'Successfully re-queued smaller chunks for timeout recovery',
          {
            jobId: job.id,
            address,
            originalRange: `${fromBlock}-${toBlock}`,
            chunksRequeued: chunks.length,
            chunks: chunks.map((c) => `${c.fromBlock}-${c.toBlock}`),
            note: 'Original job completed by splitting into smaller chunks',
          }
        );

        // Don't throw error - job is completed successfully by splitting
        return;
      } catch (requeueError) {
        logger.error('Failed to re-queue smaller chunks after timeout', {
          jobId: job.id,
          address,
          fromBlock,
          toBlock,
          originalError: (error as Error).message,
          requeueError:
            requeueError instanceof Error
              ? requeueError.message
              : String(requeueError),
        });
        throw error; // Throw original timeout error
      }
    }

    // For all other errors, log and throw
    logger.error('Gap job processing failed', {
      jobId: job.id,
      address,
      fromBlock,
      toBlock,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
