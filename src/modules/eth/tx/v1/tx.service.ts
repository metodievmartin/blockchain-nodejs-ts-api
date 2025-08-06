/**
 * Blockchain Service
 * ---------------------------------
 * Main business logic for blockchain transaction and balance operations
 */
import { ethers } from 'ethers';

import {
  MappedTransaction,
  GetTransactionsResponse,
  EtherscanTransaction,
  GetBalanceResponse,
} from './tx.dto';
import { GapProcessingProgress } from '../../../../types/processing.types';

import {
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
} from '../../../../config/providers';
import {
  getCachedAddressInfo,
  getCachedBalance,
  getCachedPaginatedTransactionQuery,
  getCachedTransactionCount,
  setCachedAddressInfo,
  setCachedBalance,
  setCachedPaginatedTransactionQuery,
  setCachedTransactionCount,
} from '../../../../core/cache/cache.service';
import {
  validateAndNormalizeAddress,
  validateBlockRange,
} from '../../utils/address-validator';
import {
  mapDBTransactionToAPI,
  mapEtherscanTransactionToAPI,
  mapEtherscanTransactionToDB,
} from '../../utils/transaction-mapper';
import {
  isEtherscanTimeoutError,
  splitBlockRange,
} from '../../utils/etherscan-helpers';
import {
  getAddressInfoFromDB,
  saveAddressInfoToDB,
} from '../../core/address-info.repository';
import logger from '../../../../config/logger';
import { findGapsInCoverage } from '../../core/gap-finder';
import { processGapsInBackground } from '../../core/background-processor';
import { AddressInfo, discoverAddressInfo } from '../../core/contract-detector';

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
): Promise<GetTransactionsResponse> {
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

  let result: GetTransactionsResponse;

  if (!hasGaps) {
    // -- No gaps - serve from the database directly --
    logger.info('Serving from database (complete coverage)', {
      address: normalizedAddress,
      fromBlock: actualFrom,
      toBlock: actualTo,
      page,
      limit,
    });

    result = await fetchTransactionsFromDatabase(
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

  // -- There are gaps, serve from Etherscan and schedule background processing --
  logger.info('Serving from Etherscan (incomplete coverage)', {
    address: normalizedAddress,
    fromBlock: actualFrom,
    toBlock: actualTo,
    page,
    limit,
  });

  // Try Etherscan first
  result = await fetchTransactionsFromEtherscan(
    normalizedAddress,
    actualFrom,
    actualTo,
    page,
    limit,
    order
  );

  if (!result) {
    // If Etherscan failed - fallback to the database
    logger.info('Etherscan failed, falling back to database', {
      address: normalizedAddress,
    });

    result = await fetchTransactionsFromDatabase(
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

  await setCachedPaginatedTransactionQuery(
    normalizedAddress,
    actualFrom,
    actualTo,
    page,
    limit,
    order,
    result
  );

  // Schedule background processing to fill gaps (non-blocking)
  processGapsInBackground(normalizedAddress, gaps);
  logger.info('After Scheduled background processing');

  return result;
}

/**
 * Get balance for an address with database persistence and fallback
 * @param address - Ethereum address
 * @returns Balance information with ETH and wei values
 */
export async function getBalance(address: string): Promise<GetBalanceResponse> {
  const startTime = performance.now();
  const normalizedAddress = validateAndNormalizeAddress(address);
  logger.info('Processing balance request', { address: normalizedAddress });

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
      fromCache: true,
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
      fromCache: false,
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
          fromCache: false,
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
 * @returns Transaction count with metadata
 */
export async function getStoredTransactionCount(address: string): Promise<{
  address: string;
  count: number;
  fromCache: boolean;
  source: 'cache' | 'database';
}> {
  const startTime = performance.now();
  const normalizedAddress = validateAndNormalizeAddress(address);

  logger.info('Processing transaction count request', {
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

    return {
      address: normalizedAddress,
      count: cached,
      fromCache: true,
      source: 'cache',
    };
  }

  // Fetch from database
  const count = await getTransactionCount(normalizedAddress);

  // Cache the result (5 minutes TTL since transaction counts change relatively frequently)
  await setCachedTransactionCount(normalizedAddress, count);

  logger.info('Fetched transaction count from database', {
    address: normalizedAddress,
    count,
    responseTime: performance.now() - startTime,
  });

  return {
    address: normalizedAddress,
    count,
    fromCache: false,
    source: 'database',
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
    const allTransactions: MappedTransaction[] = [];
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
    logger.debug('Address info cache hit', {
      address,
      isContract: cachedAddressInfo.isContract,
      creationBlock: cachedAddressInfo.creationBlock,
    });
    return getStartingBlockFromInfo(cachedAddressInfo);
  }

  // 2. Try the database
  const storedAddressInfo = await getAddressInfoFromDB(address);
  if (storedAddressInfo) {
    logger.debug('Address info found in database', {
      address,
      isContract: storedAddressInfo.isContract,
      creationBlock: storedAddressInfo.creationBlock,
    });

    // Populate Redis cache from database
    await setCachedAddressInfo(address, storedAddressInfo);

    return getStartingBlockFromInfo(storedAddressInfo);
  }

  // 3. Find the address info scanning the blockchain
  logger.info('Discovering address info via blockchain scan', {
    address,
  });

  const addressInfo = await discoverAddressInfo(address);

  await Promise.all([
    // Save to the database
    saveAddressInfoToDB(address, addressInfo),
    // Cache the result
    setCachedAddressInfo(address, addressInfo),
  ]);

  logger.info('Address info discovered and cached', {
    address,
    isContract: addressInfo.isContract,
    creationBlock: addressInfo.creationBlock,
  });

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
): Promise<GetTransactionsResponse> {
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

  const metadata: GetTransactionsResponse['metadata'] = {
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
 * Pure Etherscan API call function - returns raw data only
 */
async function attemptEtherscanFetch(
  address: string,
  fromBlock: number,
  toBlock: number,
  page: number,
  limit: number,
  order: 'asc' | 'desc'
): Promise<{ transactions: EtherscanTransaction[]; hasMore: boolean }> {
  const etherscanProvider = getEtherscanProvider();
  const params = {
    action: 'txlist',
    address,
    startblock: fromBlock,
    endblock: toBlock,
    offset: limit,
    page,
    sort: order,
  };

  logger.debug('Fetching transactions from Etherscan', {
    address,
    params,
  });

  const etherscanTxs = await etherscanProvider.fetch('account', params);
  const transactions = etherscanTxs || [];
  const hasMore = transactions.length === limit;

  return { transactions, hasMore };
}

/**
 * Pure Etherscan fetcher with smart retry logic
 * Returns null on failure instead of throwing - orchestration handled by caller
 */
async function fetchTransactionsFromEtherscan(
  address: string,
  fromBlock: number,
  toBlock: number,
  page: number,
  limit: number,
  order: 'asc' | 'desc'
): Promise<GetTransactionsResponse | null> {
  try {
    // First attempt: full range
    logger.debug('Fetching transactions from Etherscan', {
      address,
      fromBlock,
      toBlock,
      blocks: toBlock - fromBlock,
      page,
      limit,
      order,
    });

    const { transactions, hasMore } = await attemptEtherscanFetch(
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order
    );

    const result: GetTransactionsResponse = {
      transactions: transactions.map((tx: EtherscanTransaction) =>
        mapEtherscanTransactionToAPI(tx, address)
      ),
      fromCache: false,
      pagination: {
        page,
        limit,
        hasMore,
      },
      metadata: {
        address,
        fromBlock,
        toBlock,
        source: 'etherscan' as const,
      },
    };

    logger.debug('Returned Etherscan result', {
      address,
      page,
      limit,
      count: transactions.length,
    });

    return result;
  } catch (error) {
    if (isEtherscanTimeoutError(error)) {
      logger.warn('Etherscan timeout, retrying with half range', {
        address,
        originalRange: `${fromBlock}-${toBlock}`,
        blocks: toBlock - fromBlock,
      });

      try {
        // Second attempt: half range
        const { from, to } = splitBlockRange(fromBlock, toBlock, order);
        logger.debug('Retrying Etherscan with reduced range', {
          address,
          reducedRange: `${from}-${to}`,
          blocks: to - from,
        });

        const { transactions, hasMore } = await attemptEtherscanFetch(
          address,
          from,
          to,
          page,
          limit,
          order
        );

        const result: GetTransactionsResponse = {
          transactions: transactions.map((tx: EtherscanTransaction) =>
            mapEtherscanTransactionToAPI(tx, address)
          ),
          fromCache: false,
          pagination: {
            page,
            limit,
            hasMore,
          },
          metadata: {
            address,
            fromBlock,
            toBlock,
            source: 'etherscan' as const,
          },
        };

        logger.debug('Returned Etherscan result', {
          address,
          page,
          limit,
          count: transactions.length,
        });

        return result;
      } catch (retryError) {
        logger.error('Etherscan retry with half range also failed', {
          address,
          retryError:
            retryError instanceof Error
              ? retryError.message
              : String(retryError),
        });
        return null;
      }
    }

    logger.error('Etherscan fetch failed', {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
