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

    // CORS settings - Flexible configuration via environment variable
    cors: {
      origin:
        env.CORS_ORIGIN === '*'
          ? true // Allow all origins
          : env.CORS_ORIGIN.includes(',')
            ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) // Multiple origins
            : env.CORS_ORIGIN, // Single origin
    },

    // Rate limiting (disable in production if handled by load balancer)
    rateLimit: {
      enabled: env.ENABLE_RATE_LIMITING,
      windowMs: 10 * 60 * 1000, // 15 minutes
      max: env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
      message: 'Too many requests from this IP, please try again later.',
    },

    // Request size limits
    requestSizeLimit: '10mb',

    // Helmet security headers configuration
    helmet: {
      enabled: true, // Keep enabled - these are application-level security headers
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: false, // Disable if load balancer handles SSL termination
    },

    // Compression (disable in production if handled by reverse proxy)
    compression: {
      enabled: env.ENABLE_COMPRESSION,
    },
  },

  eth: {
    etherscanApiKey: env.ETHERSCAN_API_KEY,

    // Chain configurations
    chains: {
      sepolia: {
        name: 'sepolia',
        chainId: 11155111,
        rpcUrl: env.SEPOLIA_RPC_URL,
      },
    },

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

    // Etherscan API settings
    etherscanTimeout: env.ETHERSCAN_TIMEOUT,
  },

  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

export default appConfig;
