/**
 * Queue Configuration
 * ---------------------------------
 * Central configuration for all BullMQ queues and workers
 */

import { QueueOptions, WorkerOptions } from 'bullmq';
import { createIORedisClient } from '../config/redis';

// Queue names - centralized to avoid mismatches
export const QUEUE_NAMES = {
  GAP_PROCESSING: 'eth-gap-processing', // Restored original name
} as const;

// Job configuration
export const JOB_CONFIG = {
  GAP_PROCESSING: {
    MAX_BLOCKS_PER_JOB: 5000,
    MAX_TRANSACTIONS_PER_BATCH: 5000,
    CONCURRENCY: 2,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000,
  },
} as const;

/**
 * Get default queue options
 */
export function getDefaultQueueOptions(): QueueOptions {
  return {
    connection: createIORedisClient(),
    defaultJobOptions: {
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 500, // Keep last 50 failed jobs
      attempts: JOB_CONFIG.GAP_PROCESSING.RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: JOB_CONFIG.GAP_PROCESSING.RETRY_DELAY,
      },
    },
  };
}

/**
 * Get default worker options
 */
export function getDefaultWorkerOptions(): WorkerOptions {
  return {
    connection: createIORedisClient(),
    concurrency: JOB_CONFIG.GAP_PROCESSING.CONCURRENCY,
  };
}
