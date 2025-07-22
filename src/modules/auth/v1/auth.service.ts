import * as jwtRepository from './jwt.repository';
import { ApiError } from '../../../utils/api.error';
import * as userRepository from '../../users/v1/user.repository';
import { hashPassword, comparePasswords } from '../../shared/auth';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  calculateRefreshTokenExpiry,
  type DecodedToken,
  getAccessTokenExpiry,
} from '../../shared/jwt';
import {
  RegisterRequestBody,
  RegisterResponse,
  LoginRequestBody,
  LoginResponse,
} from './auth.dto';

// Error messages
const ERRORS = {
  INVALID_CREDENTIALS: 'Incorrect email or password',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
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
  const tokenRecord = await jwtRepository.findRefreshTokenById(decoded.jti);

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

  // Generate access token
  const accessToken = signAccessToken(userId);

  // Generate refresh token
  const { token: refreshToken, jti } = signRefreshToken(userId);

  // Store refresh token in database
  await jwtRepository.createRefreshToken({
    tokenId: jti,
    userId: userId,
    expiresAt: calculateRefreshTokenExpiry(),
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
export function verifyAccessToken(accessToken: string): DecodedToken {
  /*
   Apart from purely verifying the token as valid JWT,
   should also consider a way of invalidating the access token when the refresh token is revoked.
   Problem: even if the refresh token is revoked, the access token can still be used for a short time until it expires.
   Perhaps adding a Redis DB for a quick lookup and to keep the access token stateless might help.
   We could store a timestamp of when the user logged out and reject any access tokens that were created before that timestamp
   One timestamp per user with TTL = access token expiry - this should cover most cases
  */
  return verifyToken(accessToken, 'access');
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
  const accessToken = signAccessToken(decodedToken.userId);

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
  await jwtRepository.revokeRefreshToken(decodedToken.jti);
}

/**
 * Logout user from all sessions by revoking all their refresh tokens
 */
export async function logoutUserFromAllSessions(userId: string): Promise<void> {
  await jwtRepository.revokeAllUserRefreshTokens(userId);
}
