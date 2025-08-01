/**
 * Blockchain Service
 * ---------------------------------
 * Main business logic for blockchain transaction and balance operations
 */
import { ethers } from 'ethers';
import {
  getEthereumProvider,
  getEtherscanProvider,
  getAddressCreationBlock,
} from '../shared/provider';
import {
  validateAndNormalizeAddress,
  validateBlockRange,
} from '../shared/address-validator';
import {
  mapEthersTransactionToDB,
  mapDBTransactionToAPI,
  mapEtherscanTransactionToDB,
  mapEtherscanTransactionToAPI,
} from '../shared/transaction-mapper';
import {
  getCachedBalance,
  setCachedBalance,
  getCachedPaginatedTransactionQuery,
  setCachedPaginatedTransactionQuery,
} from '../shared/cache.service';
import {
  processLargeGapsInBackground,
  processGapInBatches,
} from '../shared/background-processor';
import {
  findGaps,
  getExistingTransactions,
  getExistingTransactionsPaginated,
  saveTransactionBatch,
  getTransactionCount,
  getCoverageRanges,
} from './blockchain.repository';
import {
  ProcessingResult,
  TransactionResponse,
  CoverageRange,
} from './blockchain.dto';
import appConfig from '../../../config/app.config';
import logger from '../../../config/logger';

/**
 * Get paginated transactions for an address
 * Serves immediate results from Etherscan/cache while background processing fills DB
 * @param address - Ethereum address
 * @param fromBlock - Starting block number (optional)
 * @param toBlock - Ending block number (optional)
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 1000, max: 1000)
 * @param order - Sort order (default: 'asc')
 * @returns Paginated transaction result
 */
export async function getTransactions(
  address: string,
  fromBlock?: number,
  toBlock?: number,
  page: number = 1,
  limit: number = 1000,
  order: 'asc' | 'desc' = 'asc'
): Promise<{
  transactions: any[];
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
  };
}> {
  const startTime = Date.now();

  // Validate and normalize inputs
  const normalizedAddress = validateAndNormalizeAddress(address);
  validateBlockRange(fromBlock, toBlock);

  const provider = getEthereumProvider();
  const etherscanProvider = getEtherscanProvider();

  // Determine actual block range
  const latestBlock = await provider.getBlockNumber();
  const actualFrom = fromBlock ?? 0;
  const actualTo = toBlock ?? latestBlock;

  logger.info('Processing paginated transaction request', {
    address: normalizedAddress,
    page,
    limit,
    order,
    fromBlock: actualFrom,
    toBlock: actualTo,
  });

  // Check cache first
  const cached = await getCachedPaginatedTransactionQuery(
    normalizedAddress,
    actualFrom,
    actualTo,
    page,
    limit,
    order
  );
  if (cached) {
    logger.info('Returning cached paginated result', {
      address: normalizedAddress,
      page,
      limit,
      count: cached.transactions.length,
      responseTime: Date.now() - startTime,
    });
    return cached;
  }

  // Check for gaps in our database coverage
  const gaps = await findGaps(normalizedAddress, actualFrom, actualTo);
  const hasGaps = gaps.length > 0;

  if (!hasGaps) {
    // No gaps - serve from database
    logger.info('Serving from database (no gaps)', {
      address: normalizedAddress,
      page,
      limit,
    });

    const dbTransactions = await getExistingTransactionsPaginated(
      normalizedAddress,
      actualFrom,
      actualTo,
      page,
      limit,
      order
    );

    const transactions = dbTransactions.map(mapDBTransactionToAPI);
    const hasMore = transactions.length === limit;

    const result = {
      transactions,
      fromCache: false,
      pagination: {
        page,
        limit,
        hasMore,
      },
      metadata: {
        address: normalizedAddress,
        fromBlock: actualFrom,
        toBlock: actualTo,
        source: 'database' as const,
      },
    };

    // Cache the result
    await setCachedPaginatedTransactionQuery(
      normalizedAddress,
      actualFrom,
      actualTo,
      page,
      limit,
      order,
      result
    );

    return result;
  }

  // Gaps exist - fetch from Etherscan for immediate response
  logger.info('Gaps detected, fetching from Etherscan', {
    address: normalizedAddress,
    gaps: gaps.length,
    page,
    limit,
  });

  try {
    const params = {
      action: 'txlist',
      address: normalizedAddress,
      startblock: actualFrom,
      endblock: actualTo,
      offset: limit,
      page: page,
      sort: order,
    };

    const etherscanTxs = await etherscanProvider.fetch('account', params);
    const transactions = etherscanTxs || [];
    const hasMore = transactions.length === limit;

    const result = {
      transactions: transactions.map((tx) =>
        mapEtherscanTransactionToAPI(tx, normalizedAddress)
      ),
      fromCache: false,
      pagination: {
        page,
        limit,
        hasMore,
      },
      metadata: {
        address: normalizedAddress,
        fromBlock: actualFrom,
        toBlock: actualTo,
        source: 'etherscan' as const,
        backgroundProcessing: true,
      },
    };

    // Cache the result
    await setCachedPaginatedTransactionQuery(
      normalizedAddress,
      actualFrom,
      actualTo,
      page,
      limit,
      order,
      result
    );

    // Start background processing to fill database
    processLargeGapsInBackground(normalizedAddress, gaps);

    logger.info('Returned Etherscan result, background processing started', {
      address: normalizedAddress,
      page,
      limit,
      count: transactions.length,
      responseTime: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    logger.error('Etherscan fetch failed, falling back to database', {
      address: normalizedAddress,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to database even with gaps
    const dbTransactions = await getExistingTransactionsPaginated(
      normalizedAddress,
      actualFrom,
      actualTo,
      page,
      limit,
      order
    );

    const transactions = dbTransactions.map(mapDBTransactionToAPI);
    const hasMore = transactions.length === limit;

    return {
      transactions,
      fromCache: false,
      pagination: {
        page,
        limit,
        hasMore,
      },
      metadata: {
        address: normalizedAddress,
        fromBlock: actualFrom,
        toBlock: actualTo,
        source: 'database' as const,
        backgroundProcessing: true,
      },
    };
  }
}

/**
 * Get balance for an address with Redis caching
 * @param address - Ethereum address
 * @returns Balance data with cache information
 */
export async function getBalance(address: string): Promise<{
  address: string;
  balance: string;
  balanceEth: string;
  blockNumber: number;
  cached: boolean;
  cacheAge?: number;
}> {
  const startTime = Date.now();
  const normalizedAddress = validateAndNormalizeAddress(address);

  logger.debug('Processing balance request', { address: normalizedAddress });

  // Try cache first
  const cached = await getCachedBalance(normalizedAddress);
  if (cached) {
    const cacheAge = Date.now() - cached.cachedAt;

    logger.info('Returning cached balance', {
      address: normalizedAddress,
      blockNumber: cached.blockNumber,
      cacheAge,
      responseTime: Date.now() - startTime,
    });

    return {
      address: normalizedAddress,
      balance: cached.balance,
      balanceEth: ethers.formatEther(cached.balance),
      blockNumber: cached.blockNumber,
      cached: true,
      cacheAge,
    };
  }

  // Fetch fresh data
  const provider = getEthereumProvider();
  const [balance, blockNumber] = await Promise.all([
    provider.getBalance(normalizedAddress),
    provider.getBlockNumber(),
  ]);

  // Cache the result
  await setCachedBalance(normalizedAddress, balance.toString(), blockNumber);

  logger.info('Fetched fresh balance', {
    address: normalizedAddress,
    blockNumber,
    responseTime: Date.now() - startTime,
  });

  return {
    address: normalizedAddress,
    balance: balance.toString(),
    balanceEth: ethers.formatEther(balance),
    blockNumber,
    cached: false,
  };
}

/**
 * Get transaction count for an address
 * @param address - Ethereum address
 * @returns Number of transactions stored
 */
export async function getStoredTransactionCount(
  address: string
): Promise<number> {
  const normalizedAddress = validateAndNormalizeAddress(address);
  return await getTransactionCount(normalizedAddress);
}

/**
 * Get coverage information for an address
 * @param address - Ethereum address
 * @returns Coverage ranges and statistics
 */
export async function getAddressCoverage(address: string): Promise<{
  address: string;
  ranges: CoverageRange[];
  totalBlocks: number;
}> {
  const normalizedAddress = validateAndNormalizeAddress(address);
  const ranges = await getCoverageRanges(normalizedAddress);

  const totalBlocks = ranges.reduce(
    (sum, range) => sum + (range.toBlock - range.fromBlock + 1),
    0
  );

  return {
    address: normalizedAddress,
    ranges: ranges.map((range) => ({
      fromBlock: range.fromBlock,
      toBlock: range.toBlock,
      createdAt: range.createdAt.toISOString(),
    })),
    totalBlocks,
  };
}
