import {
  type PublicUser,
  type UpdateUserProfileRequest,
  type ChangePasswordRequest,
} from './user.dto';
import { ApiError } from '../../../lib/errors';
import * as userRepository from './user.repository';
import { comparePasswords, hashPassword } from '../../../core/auth/auth';
import { revokeSessions } from '../../../core/auth/session.repository';
import * as jwtRepository from '../../../core/auth/jwt.repository';
import { withTransaction } from '../../../config/db';

/**
 * Get a user's public profile by ID
 *
 * @param userId - The ID of the user to retrieve
 * @returns The public user data
 * @throws ApiError if user is not found
 */
export async function fetchPublicUser(userId: string): Promise<PublicUser> {
  const user = await userRepository.getPublicUserById(userId);

  if (!user) {
    throw ApiError.notFound(`User with ID ${userId} not found`);
  }

  return user;
}

/**
 * Update a user's profile
 *
 * @param userId - The ID of the user to update
 * @param data - The data to update (email and/or username)
 * @returns The updated public user data
 * @throws ApiError if user is not found or if email/username is already taken
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileRequest
): Promise<PublicUser> {
  if (!data || !data.email || !data.username) {
    throw ApiError.badRequest('All fields (email, username) must be provided');
  }

  // Check if user exists
  const existingUser = await userRepository.findUserById(userId);
  if (!existingUser) {
    throw ApiError.notFound(`User with ID ${userId} not found`);
  }

  // Check if email is already taken by another user
  if (data.email !== existingUser.email) {
    const userWithEmail = await userRepository.findUserByEmail(data.email);
    if (userWithEmail && userWithEmail.id !== userId) {
      throw ApiError.conflict('Email is already taken');
    }
  }

  // Check if username is already taken by another user
  if (data.username !== existingUser.username) {
    // TODO: Validate username format

    const userWithUsername = await userRepository.findUserByUsername(
      data.username
    );
    if (userWithUsername && userWithUsername.id !== userId) {
      throw ApiError.conflict('Username is already taken');
    }
  }

  // Update user profile
  return userRepository.updateUser(userId, data);
}

/**
 * Change a user's password
 *
 * @param userId - The ID of the user
 * @param data - The current and new password
 * @returns The updated public user data
 * @throws ApiError if user is not found or if current password is incorrect
 */
export async function changeUserPassword(
  userId: string,
  data: ChangePasswordRequest
): Promise<void> {
  if (!data || !data.currentPassword || !data.newPassword) {
    throw ApiError.badRequest(
      'All fields (currentPassword, newPassword) must be provided'
    );
  }

  if (data.currentPassword === data.newPassword) {
    throw ApiError.badRequest(
      'New password must be different from current password'
    );
  }

  // Check if the user exists with full user data
  const existingUser = await userRepository.findUserById(userId);
  if (!existingUser) {
    throw ApiError.notFound(`User with ID ${userId} not found`);
  }

  // Verify the current password
  const isPasswordValid = await comparePasswords(
    data.currentPassword,
    existingUser.passwordHash
  );

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  // Hash the new password
  const passwordHash = await hashPassword(data.newPassword);

  // Get all active sessions before starting transaction
  const activeTokens = await jwtRepository.getActiveUserRefreshTokens(userId);
  const sessionIds = activeTokens.map((token) => token.tokenId);

  // Perform all database operations in a transaction for atomicity
  await withTransaction(async (tx) => {
    // Revoke all refresh tokens in the database
    await jwtRepository.revokeAllUserRefreshTokens(userId, tx);

    // Update the password
    await userRepository.updateUserPassword(userId, passwordHash, tx);
  });

  try {
    // After successful database operations, revoke sessions in Redis
    // This is done outside the transaction since Redis is a separate system
    await revokeSessions(sessionIds);
  } catch (error) {
    // If Redis operations failed after successful DB transaction,
    // the user's password is still changed, and sessions will expire naturally
    // think of retry logic
  }
}
