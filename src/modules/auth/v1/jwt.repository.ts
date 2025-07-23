import type {
  PrismaClient,
  RefreshToken,
  Prisma,
} from '../../../../prisma/generated/client';

import { getOrCreateDB } from '../../../config/db';

// Get DB instance once at the top level
const db = getOrCreateDB();

// Type for client parameter that can be either PrismaClient or TransactionClient
type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Executes a callback within a database transaction
 * @param callback - Function to execute within the transaction - receives Prisma Transaction client
 * @returns The result of the callback function
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(callback);
}

/**
 * Creates a new refresh token in the database
 * @param data - The refresh token data to create
 * @param client - Optional Prisma client or transaction client
 * @returns The created refresh token
 */
export async function createRefreshToken(
  data: {
    tokenId: string;
    userId: string;
    expiresAt: Date;
  },
  client: DbClient = db
): Promise<RefreshToken> {
  return client.refreshToken.create({
    data,
  });
}

/**
 * Finds a refresh token by its token ID (jti)
 * @param tokenId - The JWT ID (jti) to search for
 * @param client - Optional Prisma client or transaction client
 * @returns The refresh token if found, null otherwise
 */
export async function findRefreshTokenById(
  tokenId: string,
  client: DbClient = db
): Promise<RefreshToken | null> {
  return client.refreshToken.findUnique({
    where: {
      tokenId,
    },
  });
}

/**
 * Revokes a refresh token by setting its revokedAt timestamp
 * @param tokenId - The JWT ID (jti) to revoke
 * @param client - Optional Prisma client or transaction client
 * @returns The updated refresh token
 */
export async function revokeRefreshToken(
  tokenId: string,
  client: DbClient = db
): Promise<RefreshToken> {
  return client.refreshToken.update({
    where: {
      tokenId,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Revokes all refresh tokens for a specific user
 * @param userId - The user ID whose tokens should be revoked
 * @param client - Optional Prisma client or transaction client
 * @returns The number of tokens revoked
 */
export async function revokeAllUserRefreshTokens(
  userId: string,
  client: DbClient = db
): Promise<number> {
  const result = await client.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  return result.count;
}

/**
 * Counts the number of active (non-revoked, non-expired) refresh tokens for a user
 * @param userId - The user ID to count active sessions for
 * @param client - Optional Prisma client or transaction client
 * @returns The number of active sessions
 */
export async function getActiveUserSessionsCount(
  userId: string,
  client: DbClient = db
): Promise<number> {
  return client.refreshToken.count({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

/**
 * Gets the oldest active refresh token for a user
 * @param userId - The user ID to find the oldest session for
 * @param client - Optional Prisma client or transaction client
 * @returns The oldest active refresh token, or null if none exists
 */
export async function getOldestActiveUserSession(
  userId: string,
  client: DbClient = db
): Promise<RefreshToken | null> {
  return client.refreshToken.findFirst({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
  });
}

/**
 * Deletes expired and revoked tokens that are older than the specified date
 * @param olderThan - Date threshold for deletion
 * @param client - Optional Prisma client or transaction client
 * @returns The number of tokens deleted
 */
export async function cleanupExpiredTokens(
  olderThan: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: 7 days ago
  client: DbClient = db
): Promise<number> {
  const result = await client.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null, lt: olderThan } },
      ],
    },
  });
  return result.count;
}
