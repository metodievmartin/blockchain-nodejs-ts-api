import logger from '../config/logger';
import appConfig from '../config/app.config';
import { PrismaClient, Prisma } from '../../prisma/generated/client';

let _prisma: PrismaClient | null = null;

/**
 * Returns a singleton PrismaClient instance, creating it if it doesn't exist.
 * @param dbUrl Optional custom database URL to use for the connection.
 * @returns {PrismaClient} The Prisma client instance.
 */
export function getOrCreateDB(dbUrl?: string): PrismaClient {
  if (!_prisma) {
    const datasourceUrl = dbUrl || appConfig.db.url;
    _prisma = new PrismaClient({
      datasourceUrl,
      //log: config.db.logLevel, // trace | info | warn | error
    });
  }

  return _prisma;
}

/**
 * Establishes a connection to the database using Prisma.
 * @param dbUrl Optional custom database URL to use for the connection.
 * @returns {Promise<PrismaClient>} Resolves with the connected Prisma client.
 * @throws If connection fails, the error is thrown for upstream handling.
 */
export async function connectDB(dbUrl?: string): Promise<PrismaClient> {
  const db = getOrCreateDB(dbUrl);
  try {
    await db.$connect();
    logger.info('Database connected!');
    return db;
  } catch (err) {
    logger.error('Database connection failed!', err);
    throw err; // Let server.ts decide whether to exit
  }
}

/**
 * Disconnects the Prisma client from the database.
 * @returns {Promise<void>} Resolves when disconnected.
 */
export async function disconnectDB(): Promise<void> {
  const db = getOrCreateDB();
  await db.$disconnect();
}

/**
 * Executes a callback within a database transaction
 * @param callback - Function to execute within the transaction - receives Prisma Transaction client
 * @returns The result of the callback function
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const db = getOrCreateDB();
  return db.$transaction(callback);
}
