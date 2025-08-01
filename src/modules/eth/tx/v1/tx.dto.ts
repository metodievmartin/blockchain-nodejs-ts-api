/**
 * Blockchain Data Transfer Objects
 * ---------------------------------
 * Type definitions for blockchain API requests and responses
 */
import { z } from 'zod';

/**
 * Request DTOs
 */
/**
 * Query parameters for getting transactions
 */
export const GetTransactionsQuerySchema = z
  .object({
    from: z.coerce.number().int().min(0).optional(),
    to: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(1000).default(1000),
    order: z.enum(['asc', 'desc']).default('asc'),
  })
  .refine(
    (data) => {
      if (data.from !== undefined && data.to !== undefined) {
        return data.from <= data.to;
      }
      return true;
    },
    {
      message: 'fromBlock cannot be greater than toBlock',
    }
  );

export const AddressParamsSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

export type GetTransactionsQuery = z.infer<typeof GetTransactionsQuerySchema>;
export type AddressParams = z.infer<typeof AddressParamsSchema>;

/**
 * Response DTOs
 */
/**
 * Transaction response format
 */
export interface TransactionResponse {
  hash: string;
  blockNumber: string; // BigInt converted to string for JSON
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasUsed: string | null;
  gas: string | null; // Gas limit
  functionName: string | null; // Function signature/name
  status: string; // Transaction status (1 = success, 0 = failed)
  contractAddress: string | null; // Contract address for contract creation
  timestamp: string; // ISO string
}

/**
 * Response for getting transactions
 */
export interface GetTransactionsResponse {
  success: boolean;
  transactions: TransactionResponse[];
  fromCache: boolean;
  pagination: {
    page: number;
    limit: number;
    total?: number;
    hasMore?: boolean;
  };
  metadata: {
    address: string;
    fromBlock?: number;
    toBlock?: number;
    source: 'database' | 'etherscan' | 'cache';
    backgroundProcessing?: boolean;
  };
}

export interface BalanceResponse {
  success: true;
  data: {
    address: string;
    balance: string;
    balanceEth: string;
    blockNumber: number;
    cached: boolean;
    cacheAge?: number;
  };
}

export interface CoverageRange {
  fromBlock: number;
  toBlock: number;
  createdAt: string;
}

export interface GetCoverageResponse {
  success: true;
  data: {
    address: string;
    ranges: CoverageRange[];
    totalBlocks: number;
  };
}

/**
 * Error response DTO
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Internal service types
 */
export interface Gap {
  fromBlock: number;
  toBlock: number;
}

export interface ProcessingResult {
  transactions: any[];
  metadata: {
    address: string;
    fromBlock?: number;
    toBlock?: number;
    source: 'database' | 'etherscan' | 'cache';
    cached: boolean;
    backgroundProcessing?: boolean;
  };
}
