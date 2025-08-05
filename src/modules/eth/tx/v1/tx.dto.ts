/**
 * Blockchain Data Transfer Objects
 * ---------------------------------
 * Type definitions for blockchain API requests and responses
 */
import { z } from 'zod';
import { ethers } from 'ethers';

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

/**
 * Schema for validating and transforming Ethereum addresses to checksum format
 */
export const AddressParamsSchema = z.object({
  address: z.string().transform((address, ctx) => {
    try {
      // Validate and transform to checksum format using ethers
      return ethers.getAddress(address.toLowerCase());
    } catch (error) {
      ctx.addIssue('Invalid Ethereum address');
    }
  }),
});

export type GetTransactionsQuery = z.infer<typeof GetTransactionsQuerySchema>;
export type AddressParams = z.infer<typeof AddressParamsSchema>;

/**
 * Etherscan API transaction response structure
 */
export interface EtherscanTransaction {
  blockNumber: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  gas: string;
  functionName?: string;
  contractAddress?: string;
  timeStamp: string;
  isError: string;
}

/**
 * Complete transaction response structure for getTransactions
 */
export interface GetTransactionsResult {
  transactions: TransactionResponse[];
  fromCache: boolean;
  pagination: {
    page: number;
    limit: number;
    hasMore?: boolean;
  };
  metadata: {
    address: string;
    fromBlock?: number;
    toBlock?: number;
    source: 'database' | 'etherscan' | 'cache';
    backgroundProcessing?: boolean;
    incomplete?: boolean;
  };
}

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

/**
 * Response for getting balance
 */
export interface BalanceResponse {
  address: string;
  balance: string; // Balance in ETH as string (human-readable)
  balanceWei: string; // Balance in wei as string (precise)
  blockNumber: number;
  lastUpdated: string; // ISO timestamp when balance was last fetched/updated
  cached: boolean;
  cacheAge?: number; // Cache age in milliseconds
  source: 'cache' | 'provider' | 'database'; // Data source
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
