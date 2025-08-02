/**
 * ---------------------------------
 * Background Transaction Processor
 * ---------------------------------
 * Handles background processing of large transaction gaps using BullMQ queue system
 */

import {
  queueGapsForProcessing,
  startGapProcessingWorker,
} from './queue.service';
import logger from '../../../config/logger';

// Initialize worker on module load
let workerInitialized = false;

/**
 * Initialize the gap processing worker if not already started
 */
function ensureWorkerStarted(): void {
  if (!workerInitialized) {
    startGapProcessingWorker();
    workerInitialized = true;
  }
}

/**
 * Process gaps in background using BullMQ queue system
 * Gaps are automatically batched into manageable jobs and processed by workers
 * @param address - Ethereum address
 * @param gaps - Array of gap objects with fromBlock and toBlock
 */
export function processGapsInBackground(
  address: string,
  gaps: Array<{ fromBlock: number; toBlock: number }>
): void {
  // Ensure worker is running
  // ensureWorkerStarted();

  // Queue gaps for processing (fire-and-forget)
  setImmediate(async () => {
    try {
      logger.info('Queueing gaps for background processing', {
        address,
        gaps: gaps.length,
        totalBlocks: gaps.reduce(
          (sum, gap) => sum + (gap.toBlock - gap.fromBlock + 1),
          0
        ),
      });

      await queueGapsForProcessing(address, gaps);

      logger.info('All gaps queued successfully', {
        address,
        gaps: gaps.length,
      });
    } catch (error) {
      logger.error('Failed to queue gaps for processing', {
        address,
        gaps: gaps.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
