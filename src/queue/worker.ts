/**
 * Queue Worker
 * ---------------------------------
 * BullMQ worker for processing background jobs
 */

import { Worker } from 'bullmq';

import { GapProcessingJobData } from './types';

import '../config/env';
import { createLogger } from '../config/logger';
import { QUEUE_NAMES, getDefaultWorkerOptions } from './config';
import { handleGapProcessingJob } from './handlers/gap-processing.handler';

const logger = createLogger('queue');

let worker: Worker<GapProcessingJobData> | null = null;
let isShuttingDown = false;

/**
 * Create and start the gap processing worker
 */
function createGapProcessingWorker(): Worker<GapProcessingJobData> {
  if (worker) {
    return worker;
  }

  logger.info('Creating gap processing worker', {
    queueName: QUEUE_NAMES.GAP_PROCESSING,
  });

  worker = new Worker<GapProcessingJobData>(
    QUEUE_NAMES.GAP_PROCESSING,
    handleGapProcessingJob,
    getDefaultWorkerOptions()
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info('Gap processing job completed', {
      jobId: job.id,
      address: job.data.address,
      fromBlock: job.data.fromBlock,
      toBlock: job.data.toBlock,
      progress: `${job.data.currentJob}/${job.data.totalJobs}`,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Gap processing job failed', {
      jobId: job?.id,
      address: job?.data?.address,
      fromBlock: job?.data?.fromBlock,
      toBlock: job?.data?.toBlock,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Gap processing worker error', { error: err.message });
  });

  worker.on('stalled', (jobId) => {
    logger.warn('Gap processing job stalled', { jobId });
  });

  worker.on('progress', (job, progress) => {
    logger.debug('Gap processing job progress', {
      jobId: job.id,
      address: job.data.address,
      progress,
    });
  });

  logger.info('Gap processing worker started successfully', {
    queueName: QUEUE_NAMES.GAP_PROCESSING,
    concurrency: getDefaultWorkerOptions().concurrency,
  });

  return worker;
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.info('Received shutdown signal, starting graceful shutdown', {
    signal,
  });

  try {
    if (worker) {
      logger.info('Closing worker... Finalising running jobs...');
      await worker.close();
      logger.info('Worker closed successfully');
    }

    logger.info('Worker process shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during worker shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

/**
 * Start the worker process
 */
async function startWorker(): Promise<void> {
  try {
    logger.info('Starting BullMQ worker process...');

    // Create and start the worker
    createGapProcessingWorker();

    // Setup graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in worker process', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in worker process', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise,
      });
      gracefulShutdown('unhandledRejection');
    });

    logger.info('Worker process started and ready to process jobs');
  } catch (error) {
    logger.error('Failed to start worker process', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  startWorker();
}

export { startWorker, gracefulShutdown };
