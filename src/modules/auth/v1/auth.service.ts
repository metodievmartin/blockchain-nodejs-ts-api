import {
  LoginRequestBody,
  LoginResponse,
  RegisterRequestBody,
  RegisterResponse,
} from './auth.dto';
import {
  type DecodedToken,
  calculateRefreshTokenExpiry,
  getAccessTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../../../core/auth/jwt';
import {
  createRefreshToken,
  findRefreshTokenById,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  getActiveUserSessionsCount,
  getOldestActiveUserSession,
  getActiveUserRefreshTokens,
} from '../../../core/auth/jwt.repository';
import appConfig from '../../../config/app.config';
import { ApiError } from '../../../lib/errors';
import { withTransaction } from '../../../config/db';
import * as userRepository from '../../users/v1/user.repository';
import { comparePasswords, hashPassword } from '../../../core/auth/auth';
import * as sessionRepository from '../../../core/auth/session.repository';

// Error messages
const ERRORS = {
  INVALID_CREDENTIALS: 'Incorrect email or password',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  INVALID_ACCESS_TOKEN: 'Invalid access token',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired',
  AUTHENTICATION_REQUIRED: 'Authentication required',
};

/**
 * Helper function to validate a refresh token
 * Verifies the token signature, checks if it exists in the database,
 * and ensures it's not revoked or expired
 *
 * @param refreshToken - The refresh token to validate
 * @returns The decoded token if valid
 * @throws ApiError if token is invalid, revoked, or expired
 */
async function _validateRefreshToken(
  refreshToken: string
): Promise<DecodedToken> {
  // Verify the refresh token - JWT errors will be handled by errorConverter middleware
  const decoded = verifyToken(refreshToken, 'refresh');

  if (!decoded.jti) {
    throw ApiError.unauthorized(ERRORS.INVALID_REFRESH_TOKEN);
  }

  // Check if token exists in the database
  const tokenRecord = await findRefreshTokenById(decoded.jti);

  if (!tokenRecord) {
    throw ApiError.unauthorized(ERRORS.INVALID_REFRESH_TOKEN);
  }

  // Check if the token is revoked
  if (tokenRecord.revokedAt) {
    throw ApiError.unauthorized(ERRORS.INVALID_REFRESH_TOKEN);
  }

  // Check if token is expired (double-check with database record)
  if (tokenRecord.expiresAt < new Date()) {
    throw ApiError.unauthorized(ERRORS.REFRESH_TOKEN_EXPIRED);
  }

  return decoded;
}

/**
 * Creates a new session for a user by generating access and refresh tokens
 * and storing the refresh token in the database
 *
 * @param userId - The ID of the user to create a session for
 * @returns Object containing access token, refresh token, and expiration time
 */
async function _createNewSession(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!userId) {
    throw new Error('Cannot create session without user ID');
  }

  // Generate refresh token first to get the session ID (jti)
  const { token: refreshToken, jti } = signRefreshToken(userId);

  // Generate access token with session ID
  const accessToken = signAccessToken(userId, jti);

  // Use transaction to handle session management
  await withTransaction(async (tx) => {
    // Count active sessions within the transaction
    const activeSessionsCount = await getActiveUserSessionsCount(userId, tx);

    // If the user has reached the maximum number of sessions, revoke the oldest one
    if (activeSessionsCount >= appConfig.jwt.maxSessionsPerUser) {
      const oldestSession = await getOldestActiveUserSession(userId, tx);

      if (!oldestSession) {
        // We should never get to this state so cancel the entire transaction
        throw new Error('Could not find oldest active session');
      }

      await revokeRefreshToken(oldestSession.tokenId, tx);

      // Revoke the session in Redis
      await sessionRepository.revokeSession(oldestSession.tokenId);
    }

    // Create the new refresh token
    await createRefreshToken(
      {
        tokenId: jti,
        userId,
        expiresAt: calculateRefreshTokenExpiry(),
      },
      tx
    );
  });

  // Return JWT tokens
  return {
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpiry(true),
  };
}

/**
 * Verifies an access token and returns the decoded token
 *
 * @param accessToken - The access token to verify
 * @returns The decoded token if valid
 * @throws JwtTokenError if token is invalid or expired
 */
export async function verifyAccessToken(
  accessToken: string
): Promise<DecodedToken> {
  const decoded = verifyToken(accessToken, 'access');

  if (!decoded.sid) {
    throw ApiError.unauthorized(ERRORS.INVALID_ACCESS_TOKEN);
  }

  // Check if the session to which this token belongs is revoked
  const isRevoked = await sessionRepository.isSessionRevoked(decoded.sid);

  if (isRevoked) {
    throw ApiError.unauthorized(ERRORS.INVALID_ACCESS_TOKEN);
  }

  return decoded;
}

/**
 * Register a new user
 */
export async function registerUser(
  userData: RegisterRequestBody
): Promise<RegisterResponse> {
  const { email, username, password } = userData;

  // Check if user already exists
  const existingUser = await userRepository.findUserByEmailOrUsername(
    email,
    username
  );
  if (existingUser) {
    const property = existingUser.email === email ? 'email' : 'username';
    throw ApiError.conflict(`User with this ${property} already exists`);
  }

  // Hash the password using shared helper
  const passwordHash = await hashPassword(password);

  // Create the user
  const newUser = await userRepository.createUser({
    email,
    username,
    passwordHash,
  });

  // Return user data without password hash
  return {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    createdAt: newUser.createdAt.toISOString(),
  };
}

/**
 * Login user
 */
export async function loginUser(
  loginData: LoginRequestBody
): Promise<LoginResponse> {
  const { email, password } = loginData;

  // Keep the message generic without revealing too many details
  const invalidCredentialsMsg = ERRORS.INVALID_CREDENTIALS;

  // Find user by email
  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    throw ApiError.unauthorized(invalidCredentialsMsg);
  }

  // Verify password using shared helper
  const isPasswordValid = await comparePasswords(password, user.passwordHash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized(invalidCredentialsMsg);
  }

  // Create a new session for the user
  return _createNewSession(user.id);
}

/**
 * Refresh access token using a valid refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  // Validate the refresh token
  const decodedToken = await _validateRefreshToken(refreshToken);

  // Generate new access token
  const accessToken = signAccessToken(decodedToken.userId, decodedToken.jti);

  return {
    accessToken,
    expiresIn: getAccessTokenExpiry(true),
  };
}

/**
 * Logout user by revoking their refresh token
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  // Validate the refresh token
  const decodedToken = await _validateRefreshToken(refreshToken);

  // Revoke the token
  await revokeRefreshToken(decodedToken.jti);
  await sessionRepository.revokeSession(decodedToken.jti);
}

/**
 * Logs out a user from all sessions by revoking all their refresh tokens
 * @param userId - The user ID to logout from all sessions
 */
export async function logoutUserFromAllSessions(userId: string): Promise<void> {
  // Get all active refresh tokens for the user to revoke their sessions
  const activeTokens = await getActiveUserRefreshTokens(userId);
  const sessionIds = activeTokens.map((token) => token.tokenId);

  // Revoke all refresh tokens in the database
  await revokeAllUserRefreshTokens(userId);

  // Revoke all sessions in Redis
  if (sessionIds.length > 0) {
    await sessionRepository.revokeSessions(sessionIds);
  }
}
