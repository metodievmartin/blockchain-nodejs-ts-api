/**
 * ---------------------------------
 * BullMQ Queue Service
 * ---------------------------------
 * Queue management for background transaction processing
 */

import { Queue, Worker, Job } from 'bullmq';
import Bottleneck from 'bottleneck';
import { createIORedisClient } from '../../../config/redis';
import { getEtherscanProvider } from './provider';
import { mapEtherscanTransactionToDB } from './transaction-mapper';
import { saveTransactionBatch } from '../tx/v1/tx.repository';
import appConfig from '../../../config/app.config';
import logger from '../../../config/logger';

// Job data interfaces
export interface GapProcessingJobData {
  address: string;
  fromBlock: number;
  toBlock: number;
  totalJobs: number;
  currentJob: number;
}

// Queue configuration
const QUEUE_NAME = 'eth-gap-processing';
const MAX_BLOCKS_PER_JOB = 5000; // Maximum blocks to process in a single job
const MAX_TRANSACTIONS_PER_BATCH = 5000; // Maximum transactions per Etherscan API call

let gapProcessingQueue: Queue<GapProcessingJobData> | null = null;
let gapProcessingWorker: Worker<GapProcessingJobData> | null = null;

// Etherscan API rate limiter: 5 requests per second
const etherscanLimiter = new Bottleneck({
  reservoir: 5, // Initial number of requests
  reservoirRefreshAmount: 5, // Number of requests to add
  reservoirRefreshInterval: 1000, // Refresh every 1 second (1000ms)
  maxConcurrent: 1, // Only 1 request at a time to ensure proper rate limiting
});

/**
 * Get or create the gap processing queue
 */
export function getGapProcessingQueue(): Queue<GapProcessingJobData> {
  if (!gapProcessingQueue) {
    const connection = createIORedisClient();

    gapProcessingQueue = new Queue<GapProcessingJobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3, // Retry failed jobs up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    logger.info('Gap processing queue initialized');
  }

  return gapProcessingQueue;
}

/**
 * Start the gap processing worker
 */
export function startGapProcessingWorker(): Worker<GapProcessingJobData> {
  if (gapProcessingWorker) {
    return gapProcessingWorker;
  }

  const connection = createIORedisClient();

  gapProcessingWorker = new Worker<GapProcessingJobData>(
    QUEUE_NAME,
    async (job: Job<GapProcessingJobData>) => {
      await processGapJob(job);
    },
    {
      connection,
      concurrency: 2, // Process 2 jobs concurrently
    }
  );

  // Worker event handlers
  gapProcessingWorker.on('completed', (job) => {
    logger.info('Gap processing job completed', {
      jobId: job.id,
      address: job.data.address,
      fromBlock: job.data.fromBlock,
      toBlock: job.data.toBlock,
      progress: `${job.data.currentJob}/${job.data.totalJobs}`,
    });
  });

  gapProcessingWorker.on('failed', (job, err) => {
    logger.error('Gap processing job failed', {
      jobId: job?.id,
      address: job?.data?.address,
      fromBlock: job?.data?.fromBlock,
      toBlock: job?.data?.toBlock,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  gapProcessingWorker.on('error', (err) => {
    logger.error('Gap processing worker error', { error: err.message });
  });

  logger.info('Gap processing worker started');
  return gapProcessingWorker;
}

/**
 * Add gaps to the processing queue with intelligent batching
 * @param address - Ethereum address
 * @param gaps - Array of gap objects with fromBlock and toBlock
 */
export async function queueGapsForProcessing(
  address: string,
  gaps: Array<{ fromBlock: number; toBlock: number }>
): Promise<void> {
  const queue = getGapProcessingQueue();
  const jobs: Array<{ data: GapProcessingJobData; opts?: any }> = [];

  let totalJobs = 0;
  let currentJob = 0;

  // First pass: calculate total number of jobs needed
  for (const gap of gaps) {
    const gapSize = gap.toBlock - gap.fromBlock + 1;
    const jobsForGap = Math.ceil(gapSize / MAX_BLOCKS_PER_JOB);
    totalJobs += jobsForGap;
  }

  // Second pass: create batched jobs
  for (const gap of gaps) {
    const gapSize = gap.toBlock - gap.fromBlock + 1;

    if (gapSize <= MAX_BLOCKS_PER_JOB) {
      // Small gap - process as single job
      currentJob++;
      const jobId = `${address}-${gap.fromBlock}-${gap.toBlock}`;
      jobs.push({
        data: {
          address,
          fromBlock: gap.fromBlock,
          toBlock: gap.toBlock,
          totalJobs,
          currentJob,
        },
        opts: {
          jobId, // Move jobId to opts for proper deduplication
          priority: calculateJobPriority(gapSize),
          delay: currentJob * 1000, // Stagger job execution
        },
      });
    } else {
      // Large gap - split into multiple jobs
      let currentFromBlock = gap.fromBlock;

      while (currentFromBlock <= gap.toBlock) {
        const currentToBlock = Math.min(
          currentFromBlock + MAX_BLOCKS_PER_JOB - 1,
          gap.toBlock
        );

        currentJob++;
        const jobId = `${address}-${currentFromBlock}-${currentToBlock}`;
        jobs.push({
          data: {
            address,
            fromBlock: currentFromBlock,
            toBlock: currentToBlock,
            totalJobs,
            currentJob,
          },
          opts: {
            jobId, // Move jobId to opts for proper deduplication
            priority: calculateJobPriority(
              currentToBlock - currentFromBlock + 1
            ),
            delay: currentJob * 1000, // Stagger job execution
          },
        });

        currentFromBlock = currentToBlock + 1;
      }
    }
  }

  // Add all jobs to the queue
  const jobsWithNames = jobs.map((job, index) => ({
    name: `gap-processing-${job.data.address}-${job.data.fromBlock}-${job.data.toBlock}`,
    data: job.data,
    opts: job.opts,
  }));

  await queue.addBulk(jobsWithNames);

  logger.info('Gaps queued for background processing', {
    address,
    originalGaps: gaps.length,
    totalJobs,
    maxBlocksPerJob: MAX_BLOCKS_PER_JOB,
  });
}

/**
 * Calculate job priority based on gap size (smaller gaps get higher priority)
 */
function calculateJobPriority(gapSize: number): number {
  if (gapSize <= 100) return 10; // Highest priority for very small gaps
  if (gapSize <= 1000) return 5; // Medium priority
  return 1; // Lowest priority for large gaps
}

/**
 * Process a single gap job
 */
async function processGapJob(job: Job<GapProcessingJobData>): Promise<void> {
  const { address, fromBlock, toBlock, totalJobs, currentJob } = job.data;

  logger.info('Processing gap job', {
    jobId: job.id,
    address,
    fromBlock,
    toBlock,
    blocks: toBlock - fromBlock + 1,
    progress: `${currentJob}/${totalJobs}`,
  });

  try {
    const etherscanProvider = getEtherscanProvider();
    const allTransactions: any[] = [];

    // Use pagination to fetch all transactions for this block range
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      // Update job progress
      await job.updateProgress({
        stage: 'fetching',
        page,
        fromBlock,
        toBlock,
      });

      const params = {
        action: 'txlist',
        address,
        startblock: fromBlock,
        endblock: toBlock,
        offset: MAX_TRANSACTIONS_PER_BATCH,
        page,
        sort: 'asc',
      };

      logger.debug('Fetching transactions from Etherscan', {
        jobId: job.id,
        address,
        fromBlock,
        toBlock,
        page,
        offset: MAX_TRANSACTIONS_PER_BATCH,
      });

      // Use rate limiter for Etherscan API calls
      const transactions = await etherscanLimiter.schedule(() =>
        etherscanProvider.fetch('account', params)
      );

      if (!transactions || transactions.length === 0) {
        hasMore = false;
        break;
      }

      // Filter transactions to ensure they're within our block range
      const filteredTransactions = transactions.filter(
        (tx: any) =>
          parseInt(tx.blockNumber) >= fromBlock &&
          parseInt(tx.blockNumber) <= toBlock
      );

      allTransactions.push(...filteredTransactions);

      // Check if we got fewer transactions than requested (indicates last page)
      if (transactions.length < MAX_TRANSACTIONS_PER_BATCH) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Update job progress
    await job.updateProgress({
      stage: 'mapping',
      transactionCount: allTransactions.length,
    });

    // Map transactions to database format
    const mappedTransactions = allTransactions.map((tx) =>
      mapEtherscanTransactionToDB(tx, address)
    );

    // Update job progress
    await job.updateProgress({
      stage: 'saving',
      transactionCount: mappedTransactions.length,
    });

    // Save transactions and coverage to database
    await saveTransactionBatch(address, fromBlock, toBlock, mappedTransactions);

    logger.info('Gap job completed successfully', {
      jobId: job.id,
      address,
      fromBlock,
      toBlock,
      transactionCount: mappedTransactions.length,
      pages: page,
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
    throw error; // Re-throw to trigger job retry
  }
}

/**
 * Stop the gap processing worker
 */
export async function stopGapProcessingWorker(): Promise<void> {
  if (gapProcessingWorker) {
    await gapProcessingWorker.close();
    gapProcessingWorker = null;
    logger.info('Gap processing worker stopped');
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getGapProcessingQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}
