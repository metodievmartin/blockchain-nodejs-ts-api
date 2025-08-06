import jwt from 'jsonwebtoken';
import { v4 as uuidV4 } from 'uuid';

import appConfig from '../../config/app.config';
import { JwtTokenError } from '../../lib/errors';

/**
 * Payload structure for JWT tokens
 */
export interface JwtPayload {
  userId: string;
  type: 'access' | 'refresh';
  jti?: string; // JWT ID for refresh tokens
  sid?: string; // Session ID for access tokens (links to refresh token jti)
}

/**
 * Decoded JWT token with payload
 */
export interface DecodedToken {
  userId: string;
  type: 'access' | 'refresh';
  jti?: string;
  sid?: string;
  iat: number;
  exp: number;
}

/**
 * Signs an access token for a user
 * @param userId - The user ID to include in the token
 * @param sessionId - The session ID (refresh token jti) to link this access token to
 * @returns The signed JWT access token
 */
export const signAccessToken = (userId: string, sessionId: string): string => {
  const payload: JwtPayload = {
    userId,
    type: 'access',
    sid: sessionId, // Link access token to session
  };

  return jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.accessToken.expiresIn,
  });
};

/**
 * Signs a refresh token for a user
 * @param userId - The user ID to include in the token
 * @returns An object containing the signed JWT refresh token and its JWT ID
 */
export const signRefreshToken = (
  userId: string
): { token: string; jti: string } => {
  const jti = uuidV4(); // Generate a unique ID for the token

  const payload: JwtPayload = {
    userId,
    type: 'refresh',
    jti,
  };

  const token = jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.refreshToken.expiresIn,
  });

  return { token, jti };
};

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @param type - The expected token type ('access' or 'refresh')
 * @returns The decoded token payload if valid
 * @throws Error if the token is invalid or of the wrong type
 */
export const verifyToken = (
  token: string,
  type: 'access' | 'refresh'
): DecodedToken => {
  try {
    const decoded = jwt.verify(token, appConfig.jwt.secret) as DecodedToken;

    // Verify token type matches expected type
    if (decoded.type !== type) {
      throw new jwt.JsonWebTokenError(
        `Invalid token type. Expected ${type} token.`
      );
    }

    return decoded;
  } catch (err) {
    // log error
    if (
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.NotBeforeError
    ) {
      throw new JwtTokenError(err, type);
    }
    throw err;
  }
};

/**
 * Calculates the expiration date for a refresh token based on config
 * @returns Date object representing when the token will expire
 */
export const calculateRefreshTokenExpiry = (): Date => {
  const expiresInMs = parseExpirationToMs(appConfig.jwt.refreshToken.expiresIn);
  return new Date(Date.now() + expiresInMs);
};

/**
 * Helper to parse JWT expiration time string to seconds
 * @param expiration - JWT expiration string (e.g., '15m', '7d')
 * @returns Seconds representation of the expiration time
 */
export function parseExpirationToSeconds(expiration: string): number {
  return Math.floor(parseExpirationToMs(expiration) / 1000);
}

/**
 * Helper to parse JWT expiration time string to milliseconds
 * @param expiration - JWT expiration string (e.g., '15m', '7d')
 * @returns Milliseconds representation of the expiration time
 */
function parseExpirationToMs(expiration: string): number {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0; // Default case, though this should never happen with proper config
  }
}

/**
 * Helper to parse JWT expiration time string to seconds/milliseconds
 * @param inSeconds - Whether to return the expiration time in seconds
 * @returns Expiration time in seconds or milliseconds
 */
export const getAccessTokenExpiry = (inSeconds?: boolean): number => {
  const parsed = parseExpirationToMs(appConfig.jwt.accessToken.expiresIn);

  if (inSeconds) {
    return parseExpirationToSeconds(appConfig.jwt.accessToken.expiresIn);
  }

  return parsed;
};
