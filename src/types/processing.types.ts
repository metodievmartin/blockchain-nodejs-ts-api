/**
 * Processing-related types
 * ---------------------------------
 * Shared types for background processing, queues, and workers
 */

/**
 * Progress callback interface for gap processing
 * Used by background processors, queues, and workers
 */
export interface GapProcessingProgress {
  phase: 'fetching' | 'saving';
  page?: number;
  totalPages?: string | number;
  currentBlock?: number;
  targetBlock?: number;
  transactions?: number;
  blocksProcessed?: number;
  totalBlocks?: number;
}
