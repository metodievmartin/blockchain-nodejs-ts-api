/**
 * Application Configuration
 * ---------------------------------
 * This file is the SINGLE SOURCE OF TRUTH for all runtime configuration values.
 * Any changes to app settings, environment, or feature flags must be made here.
 */
import { env } from './env';

const appConfig = {
  nodeEnv: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isDev: env.NODE_ENV === 'development',

  server: {
    port: env.PORT,
  },

  db: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,

    accessToken: {
      expiresIn: '15m',
    },

    refreshToken: {
      expiresIn: '7d',
    },
    
    // Maximum number of active sessions per user
    maxSessionsPerUser: 5,
  },
  
  security: {
    saltRounds: env.SALT_ROUNDS,
  },
  
  blockchain: {
    rpcUrl: env.SEPOLIA_RPC_URL,
    etherscanApiKey: env.ETHERSCAN_API_KEY,
    
    // Performance tuning
    batchSize: env.BLOCKCHAIN_BATCH_SIZE,
    syncThreshold: env.BLOCKCHAIN_SYNC_THRESHOLD,
    maxConcurrent: env.BLOCKCHAIN_MAX_CONCURRENT,
    
    // Caching
    balanceCacheTtl: env.BALANCE_CACHE_TTL,
    txQueryCacheTtl: env.TX_QUERY_CACHE_TTL,
    transactionCountCacheTtl: env.TRANSACTION_COUNT_CACHE_TTL,
    addressInfoCacheTtl: env.ADDRESS_INFO_CACHE_TTL,
    
    // RPC settings
    rpcTimeout: env.RPC_TIMEOUT,
    rpcRetryAttempts: env.RPC_RETRY_ATTEMPTS,
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

export default appConfig;
