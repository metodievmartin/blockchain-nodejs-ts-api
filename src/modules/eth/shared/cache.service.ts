/**
 * Blockchain Cache Service
 * ---------------------------------
 * Redis-based caching utilities for blockchain data
 */
import { getOrCreateRedisClient } from '../../../config/redis';
import appConfig from '../../../config/app.config';
import logger from '../../../config/logger';

const redis = getOrCreateRedisClient();

/**
 * Cache keys for different data types
 */
const CACHE_KEYS = {
  BALANCE: (address: string) => `blockchain:balance:${address.toLowerCase()}`,
  TX_QUERY: (address: string, from: number, to: number) =>
    `blockchain:txquery:${address.toLowerCase()}:${from}:${to}`,
  TX_PAGINATED: (
    address: string,
    fromBlock: number,
    toBlock: number,
    page: number,
    limit: number,
    order: string
  ) =>
    `blockchain:tx:paginated:${address.toLowerCase()}:${fromBlock}:${toBlock}:${page}:${limit}:${order}`,
  TX_COUNT: (address: string) => `blockchain:txcount:${address.toLowerCase()}`,
  ADDRESS_INFO: (address: string) => `blockchain:address_info:${address.toLowerCase()}`,
} as const;

/**
 * Balance caching functions
 */
export async function getCachedBalance(address: string): Promise<{
  balance: string;
  blockNumber: number;
  cachedAt: number;
} | null> {
  try {
    const key = CACHE_KEYS.BALANCE(address);
    const cached = await redis.hGetAll(key);

    if (
      cached &&
      Object.keys(cached).length > 0 &&
      cached.balance &&
      cached.blockNumber &&
      cached.cachedAt
    ) {
      return {
        balance: cached.balance,
        blockNumber: parseInt(cached.blockNumber),
        cachedAt: parseInt(cached.cachedAt),
      };
    }

    return null;
  } catch (error) {
    logger.error('Error getting cached balance', { address, error });
    return null;
  }
}

export async function setCachedBalance(
  address: string,
  balance: string,
  blockNumber: number
): Promise<void> {
  try {
    const key = CACHE_KEYS.BALANCE(address);
    const ttl = appConfig.blockchain.balanceCacheTtl;

    await redis.hSet(key, {
      balance,
      blockNumber: blockNumber.toString(),
      cachedAt: Date.now().toString(),
    });

    await redis.expire(key, ttl);

    logger.debug('Balance cached', { address, blockNumber, ttl });
  } catch (error) {
    logger.error('Error caching balance', { address, error });
  }
}

/**
 * Transaction query caching functions
 */
export async function getCachedTransactionQuery(
  address: string,
  fromBlock: number,
  toBlock: number
): Promise<any[] | null> {
  try {
    const key = CACHE_KEYS.TX_QUERY(address, fromBlock, toBlock);
    const cached = await redis.get(key);

    return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error('Error getting cached transaction query', {
      address,
      fromBlock,
      toBlock,
      error,
    });
    return null;
  }
}

export async function setCachedTransactionQuery(
  address: string,
  fromBlock: number,
  toBlock: number,
  transactions: any[]
): Promise<void> {
  try {
    const key = CACHE_KEYS.TX_QUERY(address, fromBlock, toBlock);
    const ttl = appConfig.blockchain.txQueryCacheTtl;

    await redis.setEx(key, ttl, JSON.stringify(transactions));

    logger.debug('Transaction query cached', {
      address,
      fromBlock,
      toBlock,
      count: transactions.length,
      ttl,
    });
  } catch (error) {
    logger.error('Error caching transaction query', {
      address,
      fromBlock,
      toBlock,
      error,
    });
  }
}

/**
 * Paginated transaction query caching functions
 */
export async function getCachedPaginatedTransactionQuery(
  address: string,
  fromBlock: number,
  toBlock: number,
  page: number,
  limit: number,
  order: string
): Promise<any | null> {
  try {
    const key = CACHE_KEYS.TX_PAGINATED(
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order
    );
    const cached = await redis.get(key);

    return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error('Error getting cached paginated transaction query', {
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order,
      error,
    });
    return null;
  }
}

export async function setCachedPaginatedTransactionQuery(
  address: string,
  fromBlock: number,
  toBlock: number,
  page: number,
  limit: number,
  order: string,
  result: any,
  ttlSeconds: number = 300 // Default 5 minutes
): Promise<void> {
  try {
    const key = CACHE_KEYS.TX_PAGINATED(
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order
    );
    await redis.setEx(
      key,
      ttlSeconds,
      JSON.stringify({ ...result, fromCache: true }) // just a shallow copy not affecting the transactions
    );

    logger.debug('Cached paginated transaction query', {
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order,
      ttl: ttlSeconds,
    });
  } catch (error) {
    logger.error('Error caching paginated transaction query', {
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order,
      error,
    });
  }
}

/**
 * Transaction count caching functions
 */
export async function getCachedTransactionCount(
  address: string
): Promise<number | null> {
  try {
    const key = CACHE_KEYS.TX_COUNT(address);
    const cached = await redis.get(key);

    return cached && typeof cached === 'string' && cached !== ''
      ? parseInt(cached)
      : null;
  } catch (error) {
    logger.error('Error getting cached transaction count', { address, error });
    return null;
  }
}

export async function setCachedTransactionCount(
  address: string,
  count: number
): Promise<void> {
  try {
    const key = CACHE_KEYS.TX_COUNT(address);
    const ttl = appConfig.blockchain.transactionCountCacheTtl;

    await redis.setEx(key, ttl, count.toString());

    logger.debug('Transaction count cached', { address, count, ttl });
  } catch (error) {
    logger.error('Error caching transaction count', { address, error });
  }
}

/**
 * Address info caching functions
 */
export async function getCachedAddressInfo(
  address: string
): Promise<any | null> {
  try {
    const key = CACHE_KEYS.ADDRESS_INFO(address);
    const cached = await redis.get(key);

    return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error('Error getting cached address info', { address, error });
    return null;
  }
}

export async function setCachedAddressInfo(
  address: string,
  info: any
): Promise<void> {
  try {
    const key = CACHE_KEYS.ADDRESS_INFO(address);
    const ttl = appConfig.blockchain.addressInfoCacheTtl;

    await redis.setEx(key, ttl, JSON.stringify(info));

    logger.debug('Address info cached', { address, ttl });
  } catch (error) {
    logger.error('Error caching address info', { address, error });
  }
}

/**
 * Clear all cache for an address
 */
export async function clearAddressCache(address: string): Promise<void> {
  try {
    const keys = [
      CACHE_KEYS.BALANCE(address),
      CACHE_KEYS.TX_COUNT(address),
      CACHE_KEYS.ADDRESS_INFO(address),
    ];

    // Get all paginated transaction cache keys for this address
    const pattern = `blockchain:tx:paginated:${address.toLowerCase()}:*`;
    const paginatedKeys = await redis.keys(pattern);

    // Get all transaction query cache keys for this address
    const queryPattern = `blockchain:txquery:${address.toLowerCase()}:*`;
    const queryKeys = await redis.keys(queryPattern);

    const allKeys = [...keys, ...paginatedKeys, ...queryKeys];

    if (allKeys.length > 0) {
      await redis.del(allKeys);
      logger.debug('Cleared cache for address', { address, keysCleared: allKeys.length });
    }
  } catch (error) {
    logger.error('Error clearing cache for address', { address, error });
  }
}
