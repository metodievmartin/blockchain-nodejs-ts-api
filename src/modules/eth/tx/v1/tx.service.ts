/**
 * Blockchain Service
 * ---------------------------------
 * Main business logic for blockchain transaction and balance operations
 */
import { ethers } from 'ethers';

import {
  CoverageRange,
  TransactionResponse,
  GetTransactionsResult,
  EtherscanTransaction,
} from './tx.dto';
import { GapProcessingProgress } from '../../../../types/processing.types';

import {
  getAllCoverageRanges,
  getCoverageRanges,
  getExistingTransactionsPaginated,
  getStoredBalance,
  getTransactionCount,
  saveBalance,
  saveTransactionBatch,
} from './tx.repository';
import {
  getEthereumProvider,
  getEtherscanProvider,
} from '../../shared/provider';
import {
  getCachedAddressInfo,
  getCachedBalance,
  getCachedPaginatedTransactionQuery,
  getCachedTransactionCount,
  setCachedAddressInfo,
  setCachedBalance,
  setCachedPaginatedTransactionQuery,
  setCachedTransactionCount,
} from '../../shared/cache.service';
import {
  validateAndNormalizeAddress,
  validateBlockRange,
} from '../../shared/address-validator';
import {
  discoverAddressInfo,
  type AddressInfo,
} from '../../shared/contract-detector';
import {
  mapDBTransactionToAPI,
  mapEtherscanTransactionToAPI,
  mapEtherscanTransactionToDB,
} from '../../shared/transaction-mapper';
import {
  getAddressInfoFromDB,
  saveAddressInfoToDB,
} from '../../shared/address-info.repository';
import logger from '../../../../config/logger';
import { findGapsInCoverage } from '../../shared/gap-finder';
import { processGapsInBackground } from '../../shared/background-processor';

/**
 * Configuration constants
 */
const TX_SERVICE_CONFIG = {
  MAX_TRANSACTIONS_PER_BATCH: 5000,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 1000,
  MAX_LIMIT: 1000,
} as const;

/**
 * Handle database-only response when no gaps exist
 */
async function fetchTransactionsFromDatabase(
  normalizedAddress: string,
  actualFrom: number,
  actualTo: number,
  page: number,
  limit: number,
  order: 'asc' | 'desc',
  options: {
    incomplete?: boolean;
  } = {}
): Promise<GetTransactionsResult> {
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

  const metadata: GetTransactionsResult['metadata'] = {
    address: normalizedAddress,
    fromBlock: actualFrom,
    toBlock: actualTo,
    source: 'database' as const,
  };

  if (options.incomplete) {
    metadata.incomplete = options.incomplete;
  }

  return {
    transactions,
    fromCache: false,
    pagination: {
      page,
      limit,
      hasMore,
    },
    metadata,
  };
}

/**
 * Handle Etherscan fallback when gaps exist
 */
async function fetchTransactionsFromEtherscan(
  normalizedAddress: string,
  actualFrom: number,
  actualTo: number,
  page: number,
  limit: number,
  order: 'asc' | 'desc',
  gaps: any[]
): Promise<GetTransactionsResult> {
  logger.info('Gaps detected, fetching from Etherscan', {
    address: normalizedAddress,
    gaps: gaps.length,
    page,
    limit,
  });

  const etherscanProvider = getEtherscanProvider();

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

    const result: GetTransactionsResult = {
      transactions: transactions.map((tx: EtherscanTransaction) =>
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
      },
    };

    logger.info('Returned Etherscan result', {
      address: normalizedAddress,
      page,
      limit,
      count: transactions.length,
    });

    return result;
  } catch (error) {
    logger.error('Etherscan fetch failed, falling back to database', {
      address: normalizedAddress,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to the database even with gaps
    return fetchTransactionsFromDatabase(
      normalizedAddress,
      actualFrom,
      actualTo,
      page,
      limit,
      order,
      {
        incomplete: true,
      }
    );
  }
}

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
  page: number = TX_SERVICE_CONFIG.DEFAULT_PAGE,
  limit: number = TX_SERVICE_CONFIG.DEFAULT_LIMIT,
  order: 'asc' | 'desc' = 'asc'
): Promise<GetTransactionsResult> {
  const startTime = performance.now();

  // Validate and normalize inputs
  const normalizedAddress = validateAndNormalizeAddress(address);
  validateBlockRange(fromBlock, toBlock);

  const provider = getEthereumProvider();

  // Determine actual block range
  const actualFrom =
    fromBlock ?? (await resolveStartingBlock(normalizedAddress));
  const actualTo = toBlock ?? (await provider.getBlockNumber());

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
    logger.debug('Returning cached paginated result', {
      address: normalizedAddress,
      page,
      limit,
      count: cached.transactions.length,
      responseTime: performance.now() - startTime,
    });
    return cached;
  }

  // Check for gaps in our database coverage
  const coverageRanges = await getCoverageRanges(
    normalizedAddress,
    actualFrom,
    actualTo
  );
  const gaps = findGapsInCoverage(
    coverageRanges,
    actualFrom,
    actualTo,
    normalizedAddress
  );
  const hasGaps = gaps.length > 0;

  if (!hasGaps) {
    // No gaps - serve from the database
    const result = await fetchTransactionsFromDatabase(
      normalizedAddress,
      actualFrom,
      actualTo,
      page,
      limit,
      order
    );

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
  const result = await fetchTransactionsFromEtherscan(
    normalizedAddress,
    actualFrom,
    actualTo,
    page,
    limit,
    order,
    gaps
  );

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

  // Start background processing to fill the database (non-blocking)
  setImmediate(() => {
    processGapsInBackground(normalizedAddress, gaps).catch((error) => {
      logger.error('Background gap processing failed', {
        address: normalizedAddress,
        gapsCount: gaps.length,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - just log the error so it doesn't crash anything
    });
  });

  // Set backgroundProcessing flag since we've scheduled background work
  result.metadata.backgroundProcessing = true;

  return result;
}

/**
 * Get balance for an address with database persistence and fallback
 * @param address - Ethereum address
 * @returns Balance information with ETH and wei values
 */
export async function getBalance(address: string): Promise<{
  address: string;
  balance: string; // ETH as string (human-readable)
  balanceWei: string; // Wei as string (precise)
  blockNumber: number;
  lastUpdated: string; // ISO timestamp
  cached: boolean;
  cacheAge?: number;
  source: 'cache' | 'provider' | 'database';
}> {
  const startTime = performance.now();
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
      responseTime: performance.now() - startTime,
    });

    return {
      address: normalizedAddress,
      balance: ethers.formatEther(cached.balance),
      balanceWei: cached.balance,
      blockNumber: cached.blockNumber,
      lastUpdated: new Date(cached.cachedAt).toISOString(),
      cached: true,
      cacheAge,
      source: 'cache',
    };
  }

  // Try to fetch fresh data from provider
  try {
    const provider = getEthereumProvider();
    const [balance, blockNumber] = await Promise.all([
      provider.getBalance(normalizedAddress),
      provider.getBlockNumber(),
    ]);

    const balanceWei = balance.toString();
    const balanceEth = ethers.formatEther(balance);
    const lastUpdated = new Date().toISOString();

    // Save to the database for future fallback
    try {
      await saveBalance(normalizedAddress, balanceWei, BigInt(blockNumber));
    } catch (dbError) {
      logger.warn('Failed to save balance to database', {
        address: normalizedAddress,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      // Continue even if DB save fails
    }

    // Cache the result
    await setCachedBalance(normalizedAddress, balanceWei, blockNumber);

    logger.info('Fetched fresh balance from provider', {
      address: normalizedAddress,
      blockNumber,
      responseTime: performance.now() - startTime,
    });

    return {
      address: normalizedAddress,
      balance: balanceEth,
      balanceWei,
      blockNumber,
      lastUpdated,
      cached: false,
      source: 'provider',
    };
  } catch (providerError) {
    logger.warn('Provider failed, trying database fallback', {
      address: normalizedAddress,
      error:
        providerError instanceof Error
          ? providerError.message
          : String(providerError),
    });

    // Fallback to database
    try {
      const storedBalance = await getStoredBalance(normalizedAddress);

      if (storedBalance) {
        const balanceEth = ethers.formatEther(storedBalance.balance);

        logger.info('Returning balance from database fallback', {
          address: normalizedAddress,
          blockNumber: storedBalance.blockNumber.toString(),
          lastUpdated: storedBalance.updatedAt,
          responseTime: performance.now() - startTime,
        });

        return {
          address: normalizedAddress,
          balance: balanceEth,
          balanceWei: storedBalance.balance,
          blockNumber: Number(storedBalance.blockNumber),
          lastUpdated: storedBalance.updatedAt.toISOString(),
          cached: false,
          source: 'database',
        };
      }
    } catch (dbError) {
      logger.error('Database fallback also failed', {
        address: normalizedAddress,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    // If both provider and database fail, throw the original provider error
    logger.error('All balance sources failed', {
      address: normalizedAddress,
      providerError:
        providerError instanceof Error
          ? providerError.message
          : String(providerError),
      responseTime: performance.now() - startTime,
    });

    throw providerError;
  }
}

/**
 * Get transaction count for an address with Redis caching
 * @param address - Ethereum address
 * @returns Number of transactions stored
 */
export async function getStoredTransactionCount(
  address: string
): Promise<number> {
  const startTime = performance.now();
  const normalizedAddress = validateAndNormalizeAddress(address);

  logger.debug('Processing transaction count request', {
    address: normalizedAddress,
  });

  // Try cache first
  const cached = await getCachedTransactionCount(normalizedAddress);
  if (cached) {
    logger.info('Returning cached transaction count', {
      address: normalizedAddress,
      count: cached,
      responseTime: performance.now() - startTime,
    });

    return cached;
  }

  // Get from database
  const count = await getTransactionCount(normalizedAddress);

  // Cache the result (5 minutes TTL since transaction counts change relatively frequently)
  await setCachedTransactionCount(normalizedAddress, count);

  logger.info('Fetched transaction count from database', {
    address: normalizedAddress,
    count,
    responseTime: performance.now() - startTime,
  });

  return count;
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
  const ranges = await getAllCoverageRanges(normalizedAddress);

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

/**
 * Process a transaction gap (business logic for workers)
 * This function is exported for use by background workers
 * @param address - Ethereum address
 * @param fromBlock - Starting block number
 * @param toBlock - Ending block number
 * @param maxTransactionsPerBatch - Maximum transactions per API call
 * @param progressCallback - Optional progress callback function
 * @returns Processing result with transaction count and pages
 */
export async function processTransactionGap(
  address: string,
  fromBlock: number,
  toBlock: number,
  maxTransactionsPerBatch: number = TX_SERVICE_CONFIG.MAX_TRANSACTIONS_PER_BATCH,
  progressCallback?: (progress: GapProcessingProgress) => Promise<void>
): Promise<{
  transactionCount: number;
  pages: number;
  processedFromBlock: number;
  processedToBlock: number;
  partialRange: boolean;
}> {
  const startTime = performance.now();
  const normalizedAddress = validateAndNormalizeAddress(address);
  const etherscanProvider = getEtherscanProvider();

  logger.info('Processing transaction gap', {
    address: normalizedAddress,
    fromBlock,
    toBlock,
    blocks: toBlock - fromBlock + 1,
  });

  try {
    const allTransactions: TransactionResponse[] = [];
    let currentStartBlock = fromBlock;
    let currentEndBlock = toBlock;
    let iterationCount = 0;
    let actualEndBlock = fromBlock - 1; // Track the actual end block we've fully processed

    while (currentStartBlock <= toBlock) {
      iterationCount++;

      // Update progress if callback provided
      if (progressCallback) {
        await progressCallback({
          phase: 'fetching',
          page: iterationCount,
          totalPages: '?',
          currentBlock: currentStartBlock,
          targetBlock: toBlock,
        });
      }

      const params = {
        action: 'txlist',
        address: normalizedAddress,
        startblock: currentStartBlock,
        endblock: currentEndBlock,
        page: 1, // Always use page 1 with block-based pagination
        offset: maxTransactionsPerBatch,
        sort: 'asc',
      };

      logger.debug('Fetching transactions from Etherscan (block-based)', {
        address: normalizedAddress,
        startBlock: currentStartBlock,
        endBlock: currentEndBlock,
        iteration: iterationCount,
        offset: maxTransactionsPerBatch,
      });

      const etherscanTxs = await etherscanProvider.fetch('account', params);
      const transactions = etherscanTxs || [];
      const hasMore = transactions.length === maxTransactionsPerBatch;

      if (transactions.length === 0) {
        // No more transactions in this range
        actualEndBlock = currentEndBlock;
        break;
      }

      // Filter transactions to ensure they're within our block range
      const filteredTransactions = transactions.filter(
        (tx: any) =>
          parseInt(tx.blockNumber) >= currentStartBlock &&
          parseInt(tx.blockNumber) <= currentEndBlock
      );

      allTransactions.push(...filteredTransactions);

      // Check if we got the maximum number of transactions (hit the limit)
      if (hasMore) {
        // We likely hit the limit, need to continue from the last transaction's block
        const lastTransaction = transactions[transactions.length - 1];
        const lastBlockNumber = parseInt(lastTransaction.blockNumber);

        // Set actualEndBlock to the last fully processed block
        // We subtract 1 because there might be more transactions in lastBlockNumber
        actualEndBlock = Math.max(actualEndBlock, lastBlockNumber - 1);

        // Continue from the last block number - 1 (as per Etherscan docs)
        currentStartBlock = lastBlockNumber - 1;

        logger.info('Hit transaction limit, continuing from block', {
          address: normalizedAddress,
          lastBlockNumber,
          nextStartBlock: currentStartBlock,
          transactionsFetched: allTransactions.length,
          iteration: iterationCount,
        });
      } else {
        // We got fewer transactions than the limit, so we've processed the full range
        actualEndBlock = currentEndBlock;
        break;
      }

      // Safety check to prevent infinite loops
      if (iterationCount > 100) {
        logger.warn('Too many iterations in block-based pagination, stopping', {
          address: normalizedAddress,
          fromBlock,
          toBlock,
          currentStartBlock,
          iterations: iterationCount,
          transactionsFetched: allTransactions.length,
        });
        break;
      }
    }

    // Update progress for saving phase
    if (progressCallback) {
      await progressCallback({
        phase: 'saving',
        transactions: allTransactions.length,
        blocksProcessed: actualEndBlock - fromBlock + 1,
        totalBlocks: toBlock - fromBlock + 1,
      });
    }

    // Map transactions to database format
    const mappedTransactions = allTransactions.map((tx) =>
      mapEtherscanTransactionToDB(tx, normalizedAddress)
    );

    // Save transactions and coverage to database
    // Important: Save coverage for the actual range we processed, not the requested range
    const coverageFromBlock = fromBlock;
    const coverageToBlock = actualEndBlock;

    await saveTransactionBatch(
      normalizedAddress,
      coverageFromBlock,
      coverageToBlock,
      mappedTransactions
    );

    const processingTime = performance.now() - startTime;
    logger.info('Transaction gap processing completed', {
      address: normalizedAddress,
      requestedRange: `${fromBlock}-${toBlock}`,
      processedRange: `${coverageFromBlock}-${coverageToBlock}`,
      transactionCount: mappedTransactions.length,
      iterations: iterationCount,
      processingTime,
      partialRange: actualEndBlock < toBlock,
    });

    return {
      transactionCount: mappedTransactions.length,
      pages: iterationCount,
      processedFromBlock: coverageFromBlock,
      processedToBlock: coverageToBlock,
      partialRange: actualEndBlock < toBlock,
    };
  } catch (error) {
    logger.error('Error processing transaction gap', {
      address: normalizedAddress,
      fromBlock,
      toBlock,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Resolves the appropriate starting block for an address based on its type
 * Implements 3-tier caching: Redis → Database → Provider detection
 *
 * Note: Combines pure fetching with caching side effects for optimal performance and simplicity.
 *
 * @param address - The address to resolve starting block for
 * @returns Starting block number (creation block for contracts, 0 for EOAs)
 */
export async function resolveStartingBlock(address: string): Promise<number> {
  // 1. Try cache first
  const cachedAddressInfo = await getCachedAddressInfo(address);
  if (cachedAddressInfo) {
    logger.debug('Using cached address info', {
      address,
    });
    return getStartingBlockFromInfo(cachedAddressInfo);
  }

  // 2. Try the database
  const storedAddressInfo = await getAddressInfoFromDB(address);
  if (storedAddressInfo) {
    logger.debug('Using stored address info from database', {
      address,
    });

    // Populate Redis cache from database
    await setCachedAddressInfo(address, storedAddressInfo);

    return getStartingBlockFromInfo(storedAddressInfo);
  }

  // 3. Find the address info scanning the blockchain
  const addressInfo = await discoverAddressInfo(address);

  await Promise.all([
    // Save to the database
    saveAddressInfoToDB(address, addressInfo),
    // Cache the result
    setCachedAddressInfo(address, addressInfo),
  ]);

  return getStartingBlockFromInfo(addressInfo);
}

/**
 * Gets the appropriate starting block from address info
 * @param addressInfo - The address info object
 * @returns Starting block number
 */
function getStartingBlockFromInfo(addressInfo: AddressInfo): number {
  if (addressInfo.isContract && addressInfo.creationBlock !== undefined) {
    return addressInfo.creationBlock;
  }

  return 0; // EOA or fallback
}
