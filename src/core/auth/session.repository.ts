/**
 * Session Repository
 * ---------------------------------
 * Redis-based repository for managing session revocation data
 */
import appConfig from '../../config/app.config';
import { parseExpirationToSeconds } from './jwt';
import { getOrCreateRedisClient } from '../../config/redis';

// Get Redis client instance once at the top level
const redis = getOrCreateRedisClient();

// Calculate TTL once at module level
const accessTokenTTL = parseExpirationToSeconds(
  appConfig.jwt.accessToken.expiresIn
);

/**
 * Marks a session as revoked in Redis
 * @param sessionId - The session ID (jti from refresh token)
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const key = `revoked:sid:${sessionId}`;
  await redis.setEx(key, accessTokenTTL, '1');
}

/**
 * Checks if a session is revoked
 * @param sessionId - The session ID (jti from refresh token)
 * @returns True if the session is revoked, false otherwise
 */
export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  const key = `revoked:sid:${sessionId}`;
  const result = await redis.exists(key);

  return result === 1;
}

/**
 * Revokes multiple sessions at once
 * @param sessionIds - Array of session IDs to revoke
 */
export async function revokeSessions(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;

  // Use a pipeline for better performance when revoking multiple sessions
  const pipeline = redis.multi();

  for (const sessionId of sessionIds) {
    const key = `revoked:sid:${sessionId}`;
    pipeline.setEx(key, accessTokenTTL, '1');
  }

  await pipeline.exec();
}

/**
 * Cleans up expired revocation entries (optional maintenance function)
 * Note: Redis will automatically expire keys based on TTL, but this can be used for manual cleanup
 */
export async function cleanupExpiredRevocations(): Promise<number> {
  // Get all revoked session keys
  const keys = await redis.keys('revoked:sid:*');

  if (keys.length === 0) return 0;

  // Check which ones have expired and remove them
  const pipeline = redis.multi();
  let expiredCount = 0;

  for (const key of keys) {
    const ttl = await redis.ttl(key);
    if (ttl === -1 || ttl === -2) {
      // -1: no expiry, -2: doesn't exist
      pipeline.del(key);
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    await pipeline.exec();
  }

  return expiredCount;
}
