/**
 * Queue Types
 * ---------------------------------
 * Type definitions for all queue job data and related interfaces
 */

// Gap processing job data
export interface GapProcessingJobData {
  address: string;
  fromBlock: number;
  toBlock: number;
  totalJobs: number;
  currentJob: number;
}

// Job progress data
export interface JobProgress {
  phase: 'fetching' | 'saving';
  page?: number;
  totalPages?: string;
  transactions?: number;
  progress: string;
}

// Gap definition
export interface Gap {
  fromBlock: number;
  toBlock: number;
}

// Queue statistics
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
