/**
 * Queue Client
 * ---------------------------------
 * Queue operations and job management
 */

import logger from '../config/logger';
import { BulkJobOptions, Queue } from 'bullmq';
import { Gap, GapProcessingJobData, QueueStats } from './types';
import { getDefaultQueueOptions, JOB_CONFIG, QUEUE_NAMES } from './config';

// Global queue instances
let gapProcessingQueue: Queue<GapProcessingJobData> | null = null;

/**
 * Get or create the gap processing queue
 */
export function getGapProcessingQueue(): Queue<GapProcessingJobData> {
  if (!gapProcessingQueue) {
    gapProcessingQueue = new Queue<GapProcessingJobData>(
      QUEUE_NAMES.GAP_PROCESSING,
      getDefaultQueueOptions()
    );

    // Queue event handlers
    gapProcessingQueue.on('error', (err) => {
      logger.error('Gap processing queue error', { error: err.message });
    });

    gapProcessingQueue.on('waiting', (jobId) => {
      logger.debug('Gap processing job waiting', { jobId });
    });

    logger.info('Gap processing queue initialized', {
      queueName: QUEUE_NAMES.GAP_PROCESSING,
    });
  }

  return gapProcessingQueue;
}

/**
 * Add gaps to the processing queue with intelligent batching
 */
export async function queueGapsForProcessing(
  address: string,
  gaps: Gap[]
): Promise<void> {
  const queue = getGapProcessingQueue();
  const jobs: Array<{ data: GapProcessingJobData; opts?: BulkJobOptions }> = [];

  let totalJobs = 0;
  let currentJob = 0;

  // First pass: calculate total number of jobs needed
  for (const gap of gaps) {
    const gapSize = gap.toBlock - gap.fromBlock + 1;
    const jobsForGap = Math.ceil(
      gapSize / JOB_CONFIG.GAP_PROCESSING.MAX_BLOCKS_PER_JOB
    );
    totalJobs += jobsForGap;
  }

  logger.info('Preparing to queue gap processing jobs', {
    address,
    gaps: gaps.length,
    totalJobs,
    maxBlocksPerJob: JOB_CONFIG.GAP_PROCESSING.MAX_BLOCKS_PER_JOB,
  });

  // Second pass: create batched jobs
  for (const gap of gaps) {
    const gapSize = gap.toBlock - gap.fromBlock + 1;

    if (gapSize <= JOB_CONFIG.GAP_PROCESSING.MAX_BLOCKS_PER_JOB) {
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
          jobId,
          priority: calculateJobPriority(gapSize),
          delay: currentJob * 1000, // Stagger job execution
        },
      });
    } else {
      // Large gap - split into multiple jobs
      let currentFromBlock = gap.fromBlock;

      while (currentFromBlock <= gap.toBlock) {
        const currentToBlock = Math.min(
          currentFromBlock + JOB_CONFIG.GAP_PROCESSING.MAX_BLOCKS_PER_JOB - 1,
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
            jobId,
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

  // Add all jobs to the queue in bulk
  if (jobs.length > 0) {
    const jobsWithNames = jobs.map((job) => ({
      name: `gap-processing-${job.data.address}-${job.data.fromBlock}-${job.data.toBlock}`,
      data: job.data,
      opts: job.opts,
    }));

    await queue.addBulk(jobsWithNames);
    logger.info('Successfully queued gap processing jobs', {
      address,
      jobsQueued: jobs.length,
      totalJobs,
    });
  }
}

/**
 * Calculate job priority based on gap size
 */
function calculateJobPriority(gapSize: number): number {
  if (gapSize <= 100) return 10; // High priority for small gaps
  if (gapSize <= 1000) return 5; // Medium priority for medium gaps
  return 1; // Low priority for large gaps
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
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
