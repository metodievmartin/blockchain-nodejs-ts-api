/**
 * Gap Processing Handler
 * ---------------------------------
 * Handler for processing blockchain transaction gaps
 */

import { Job } from 'bullmq';
import Bottleneck from 'bottleneck';
import { JOB_CONFIG } from '../config';
import logger from '../../config/logger';
import { GapProcessingJobData, JobProgress } from '../types';
import { processTransactionGap } from '../../modules/eth/tx/v1/tx.service';

// Etherscan API rate limiter: 5 requests per second
const etherscanLimiter = new Bottleneck({
  reservoir: 5, // Initial number of requests
  reservoirRefreshAmount: 5, // Number of requests to add
  reservoirRefreshInterval: 1000, // Refresh every 1 second (1000ms)
  maxConcurrent: 1, // Only 1 request at a time to ensure proper rate limiting
});

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
      pages: result.pages,
      progress: `${currentJob}/${totalJobs}`,
    });
  } catch (error) {
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
