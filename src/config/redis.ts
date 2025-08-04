/**
 * Redis Client Configuration
 * ---------------------------------
 * Singleton Redis client for session invalidation and caching
 */
import Redis from 'ioredis';
import { createClient, RedisClientType } from 'redis';

import logger from './logger';
import appConfig from './app.config';

let redisClient: RedisClientType | null = null;

/**
 * Gets or creates a Redis client instance (singleton pattern)
 * @returns Redis client instance
 */
export function getOrCreateRedisClient(): RedisClientType {
  if (!redisClient) {
    redisClient = createClient({
      url: appConfig.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });
  }

  return redisClient;
}

/**
 * Creates an ioredis client instance for BullMQ
 * @returns ioredis client instance
 */
export function createIORedisClient(): Redis {
  return new Redis(appConfig.redis.url, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

/**
 * Connects to Redis if not already connected
 */
export async function connectRedis(): Promise<void> {
  const client = getOrCreateRedisClient();

  if (!client.isOpen) {
    await client.connect();
  }
}

/**
 * Disconnects from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    redisClient.destroy();
  }
}
