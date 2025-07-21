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
    // The user object is added to the request by the requireAuthentication middleware
    if (!req.user) {
      // This should never happen if the middleware is working correctly
      throw ApiError.unauthorized('Authentication required');
    }

    // Since req.user now contains the full PublicUser object, we can return it directly
    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  }
);

/**
 * PUT /users/me
 * Updates the authenticated user's profile
 */
export const updateAuthenticatedUserProfile = catchAsync(
  async (req: Request<{}, any, UpdateUserProfileRequest>, res: Response) => {
    // The user object is added to the request by the requireAuthentication middleware
    if (!req.user) {
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
