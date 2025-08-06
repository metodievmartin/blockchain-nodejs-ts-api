/**
 * Background Processor
 * ---------------------------------
 * Handles background processing of blockchain transaction gaps using BullMQ
 */

import { Gap } from '../../../queue/types';
import logger from '../../../config/logger';
import { queueGapsForProcessing } from '../../../queue/client';

/**
 * Process gaps in the background using BullMQ
 * This function schedules the processing to happen asynchronously and returns immediately
 * @param address - Ethereum address
 * @param gaps - Array of gaps to process
 */
export function processGapsInBackground(address: string, gaps: Gap[]): void {
  if (gaps.length === 0) {
    logger.debug('No gaps to process', { address });
    return;
  }

  // Schedule background processing using setImmediate for true non-blocking behavior
  setImmediate(() => {
    logger.info('Starting background gap processing', {
      address,
      gapsCount: gaps.length,
      totalBlocks: gaps.reduce(
        (sum, gap) => sum + (gap.toBlock - gap.fromBlock + 1),
        0
      ),
    });

    queueGapsForProcessing(address, gaps)
      .then(() => {
        logger.info('Successfully queued gaps for processing', {
          address,
          gapsCount: gaps.length,
        });
      })
      .catch((error) => {
        logger.error('Failed to queue gaps for processing', {
          address,
          gapsCount: gaps.length,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't throw - just log the error so it doesn't crash anything
      });
  });
}
