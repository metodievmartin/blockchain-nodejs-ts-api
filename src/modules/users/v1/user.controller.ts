import { type Request, type Response } from 'express';

import * as userService from './user.service';
import { ApiError } from '../../../utils/api.error';
import { catchAsync } from '../../../utils/catch-async';
import { type UpdateUserProfileRequest } from './user.dto';

/**
 * GET /users/me
 * Returns the authenticated user's profile
 */
export const getAuthenticatedUser = catchAsync(
  async (req: Request, res: Response) => {
    // The user ID is added to the request by the requireAuthentication middleware
    if (!req.user?.id) {
      // This should never happen if the middleware is working correctly
      throw ApiError.unauthorized('Authentication required');
    }

    const user = await userService.fetchPublicUser(req.user.id);

    return res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
);

/**
 * PUT /users/me
 * Updates the authenticated user's profile
 */
export const updateAuthenticatedUserProfile = catchAsync(
  async (req: Request<{}, any, UpdateUserProfileRequest>, res: Response) => {
    // The user ID is added to the request by the requireAuthentication middleware
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Update user profile
    const { id, email, username, createdAt, updatedAt } =
      await userService.updateUserProfile(req.user.id, req.body);

    return res.status(200).json({
      id,
      email,
      username,
      createdAt,
      updatedAt,
    });
  }
);
