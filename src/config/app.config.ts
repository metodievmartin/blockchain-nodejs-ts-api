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
} as const;

export default appConfig;
