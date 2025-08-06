/**
 * Etherscan API Utilities
 * ---------------------------------
 * Shared utilities for handling Etherscan API interactions and error handling
 */

/**
 * Detects if an error is an Etherscan timeout error
 * Used across multiple services that interact with Etherscan API
 */
export function isEtherscanTimeoutError(error: any): boolean {
  return (
    error?.info?.result?.message?.includes('Query Timeout occured') ||
    error?.message?.includes('Query Timeout') ||
    error?.code === 'SERVER_ERROR'
  );
}

/**
 * Splits a block range in half and returns the appropriate half based on sort order
 * Used for handling Etherscan timeout retries with smaller ranges
 */
export function splitBlockRange(
  fromBlock: number,
  toBlock: number,
  order: 'asc' | 'desc'
): { from: number; to: number } {
  const midBlock = Math.floor((fromBlock + toBlock) / 2);

  if (order === 'asc') {
    // Take the first half for ascending order (earlier blocks first)
    return { from: fromBlock, to: midBlock };
  } else {
    // Take the second half for descending order (later blocks first)
    return { from: midBlock + 1, to: toBlock };
  }
}

/**
 * Creates smaller chunks from a large block range for Etherscan API limits
 * Useful for breaking down large ranges that might cause timeouts
 */
export function createSmallerChunks(
  fromBlock: number,
  toBlock: number,
  maxChunkSize: number = 1000
): Array<{ fromBlock: number; toBlock: number }> {
  const chunks: Array<{ fromBlock: number; toBlock: number }> = [];
  let currentFromBlock = fromBlock;

  while (currentFromBlock <= toBlock) {
    const currentToBlock = Math.min(currentFromBlock + maxChunkSize - 1, toBlock);
    chunks.push({
      fromBlock: currentFromBlock,
      toBlock: currentToBlock,
    });
    currentFromBlock = currentToBlock + 1;
  }

  return chunks;
}
