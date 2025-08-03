/**
 * Background Processor
 * ---------------------------------
 * Handles background processing of blockchain transaction gaps using BullMQ
 */

import { queueGapsForProcessing } from '../../../queue/client';
import { Gap } from '../../../queue/types';
import logger from '../../../config/logger';

/**
 * Process gaps in the background using BullMQ
 * @param address - Ethereum address
 * @param gaps - Array of gaps to process
 */
export async function processGapsInBackground(
  address: string,
  gaps: Gap[]
): Promise<void> {
  if (gaps.length === 0) {
    logger.debug('No gaps to process', { address });
    return;
  }

  logger.info('Queuing gaps for background processing', {
    address,
    gapsCount: gaps.length,
    totalBlocks: gaps.reduce(
      (sum, gap) => sum + (gap.toBlock - gap.fromBlock + 1),
      0
    ),
  });

  try {
    await queueGapsForProcessing(address, gaps);
    logger.info('Successfully queued gaps for processing', {
      address,
      gapsCount: gaps.length,
    });
  } catch (error) {
    logger.error('Failed to queue gaps for processing', {
      address,
      gapsCount: gaps.length,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
