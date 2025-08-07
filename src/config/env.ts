/**
 * Runtime configuration loader & validator
 * ------------------------------------------------------------------
 * • Loads `.env.<NODE_ENV>` **only when NODE_ENV is NOT 'production'**.
 *   – e.g. `.env.development`, `.env.test`
 *   – Falls back to plain `.env` if the targeted file is absent.
 * • In production, it deliberately skips all files and relies on the
 *   orchestrator to inject real environment variables.
 * • All variables are validated with Zod; the app fails fast if anything
 *   is missing or malformed.
 */

import { z } from 'zod';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { config as dotenv } from 'dotenv';

// 1. Detect the running environment (default -> 'development')
const nodeEnv = process.env.NODE_ENV ?? 'development';

// 2. Conditionally load a .env file (only when not in production)
if (nodeEnv !== 'production') {
  // Env file: .env.development / .env.test
  const envFile = join(process.cwd(), `.env.${nodeEnv}`);

  if (existsSync(envFile)) {
    dotenv({ path: envFile });
  } else {
    dotenv(); // fallback to plain .env
  }
}

// 3. Define & apply the validation schema
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce
    .number('Invalid port - should be a positive number')
    .int('Invalid port - should be an integer')
    .positive('Invalid port - should be a positive number')
    .default(3000),
  DATABASE_URL: z.url('Invalid or missing DB url'),
  REDIS_URL: z.url('Invalid or missing Redis URL'),
  SALT_ROUNDS: z.coerce.number().int().positive().default(10),
  JWT_SECRET: z
    .string('Invalid or missing secret')
    .min(32, 'The secret must be at least 32 characters long'),

  // Blockchain configuration
  SEPOLIA_RPC_URL: z.url(),
  ETHERSCAN_API_KEY: z.string().optional(),

  // Performance tuning
  BLOCKCHAIN_BATCH_SIZE: z.coerce.number().default(1000),
  BLOCKCHAIN_SYNC_THRESHOLD: z.coerce.number().default(2000),
  BLOCKCHAIN_MAX_CONCURRENT: z.coerce.number().default(3),

  // Caching TTL settings (in seconds)
  BALANCE_CACHE_TTL: z.coerce.number().default(30), // 30 seconds
  TX_QUERY_CACHE_TTL: z.coerce.number().default(300), // 5 minutes
  TRANSACTION_COUNT_CACHE_TTL: z.coerce.number().default(300), // 5 minutes
  ADDRESS_INFO_CACHE_TTL: z.coerce.number().default(604800), // 7 days

  // RPC settings
  RPC_TIMEOUT: z.coerce.number().default(10000),
  RPC_RETRY_ATTEMPTS: z.coerce.number().default(3),
  ETHERSCAN_TIMEOUT: z.coerce.number().default(5000), // 5 seconds

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'verbose'])
    .default('info'), // Default to 'info' to disable debug logs

  // CORS configuration
  CORS_ORIGIN: z.string().optional().default('*'), // Default to allow all origins

  // Middleware toggles
  ENABLE_RATE_LIMITING: z
    .string()
    .default('true')
    .transform((val) => val === 'true'), // Enable by default

  ENABLE_COMPRESSION: z
    .string()
    .default('true')
    .transform((val) => val === 'true'), // Enable by default
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = z.prettifyError(parsed.error);
  throw new Error(`Invalid environment variables: \n${errors}\n`);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
