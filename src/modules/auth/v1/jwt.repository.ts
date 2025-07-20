import type { RefreshToken } from '../../../../prisma/generated/client';

import { getOrCreateDB } from '../../../config/db';

/**
 * Creates a new refresh token in the database
 * @param data - The refresh token data to create
 * @returns The created refresh token
 */
export async function createRefreshToken(data: {
  tokenId: string;
  userId: string;
  expiresAt: Date;
}): Promise<RefreshToken> {
  const db = getOrCreateDB();
  return db.refreshToken.create({
    data,
  });
}

/**
 * Finds a refresh token by its token ID (jti)
 * @param tokenId - The JWT ID (jti) to search for
 * @returns The refresh token if found, null otherwise
 */
export async function findRefreshTokenById(
  tokenId: string
): Promise<RefreshToken | null> {
  const db = getOrCreateDB();
  return db.refreshToken.findUnique({
    where: {
      tokenId,
    },
  });
}

/**
 * Revokes a refresh token by setting its revokedAt timestamp
 * @param tokenId - The JWT ID (jti) to revoke
 * @returns The updated refresh token
 */
export async function revokeRefreshToken(
  tokenId: string
): Promise<RefreshToken> {
  const db = getOrCreateDB();
  return db.refreshToken.update({
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
 * @returns The number of tokens revoked
 */
export async function revokeAllUserRefreshTokens(
  userId: string
): Promise<number> {
  const db = getOrCreateDB();
  const result = await db.refreshToken.updateMany({
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
 * Deletes expired and revoked tokens that are older than the specified date
 * @param olderThan - Date threshold for deletion
 * @returns The number of tokens deleted
 */
export async function cleanupExpiredTokens(
  olderThan: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Default: 7 days ago
): Promise<number> {
  const db = getOrCreateDB();
  const result = await db.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null, lt: olderThan } },
      ],
    },
  });
  return result.count;
}
