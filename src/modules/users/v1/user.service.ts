import { type PublicUser, type UpdateUserProfileRequest } from './user.dto';
import { ApiError } from '../../../utils/api.error';
import * as userRepository from './user.repository';

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
