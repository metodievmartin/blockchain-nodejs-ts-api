/**
 * Gap Finding Utilities
 * ---------------------------------
 * Logic for finding gaps in blockchain transaction coverage
 */

import { Gap } from '../tx/v1/tx.dto';
import logger from '../../../config/logger';

/**
 * Find gaps in coverage ranges for a given block range
 * @param coverageRanges - Array of coverage ranges (sorted by fromBlock)
 * @param requestedFrom - Starting block number
 * @param requestedTo - Ending block number
 * @param address - Address for logging purposes
 * @returns Array of gaps that need to be filled
 */
export function findGapsInCoverage(
  coverageRanges: Array<{ fromBlock: number; toBlock: number }>,
  requestedFrom: number,
  requestedTo: number,
  address: string
): Gap[] {
  logger.debug('Finding gaps in coverage', {
    address,
    requestedFrom,
    requestedTo,
    coverageCount: coverageRanges.length,
  });

  const gaps: Gap[] = [];
  let cursor = requestedFrom;

  for (const range of coverageRanges) {
    // If there's a gap before this range
    if (cursor < range.fromBlock) {
      gaps.push({
        fromBlock: cursor,
        toBlock: range.fromBlock - 1,
      });
    }

    // Move cursor past this range
    cursor = Math.max(cursor, range.toBlock + 1);
  }

  // If there's a gap after all ranges
  if (cursor <= requestedTo) {
    gaps.push({
      fromBlock: cursor,
      toBlock: requestedTo,
    });
  }

  logger.debug('Calculated gaps', {
    address,
    requestedFrom,
    requestedTo,
    gaps: gaps.length,
    totalMissingBlocks: gaps.reduce(
      (sum, gap) => sum + (gap.toBlock - gap.fromBlock + 1),
      0
    ),
  });

  return gaps;
}
