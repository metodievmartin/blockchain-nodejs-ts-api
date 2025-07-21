import { type PublicUser } from './user.dto';
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
