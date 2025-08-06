import { type Request, type Response } from 'express';

import {
  type UpdateUserProfileRequest,
  type ChangePasswordRequest,
} from './user.dto';
import { type AsyncValidatedRequestHandler } from '../../../types/request.types';

import * as userService from './user.service';
import { ApiError } from '../../../lib/errors';
import { catchAsync } from '../../../lib/async';

/**
 * GET /users/me
 * Returns the authenticated user's profile
 */
const getAuthenticatedUserHandler = async (req: Request, res: Response) => {
  // The user object is added to the request by the requireAuthentication middleware
  if (!req.user) {
    // This should never happen if the middleware is working correctly
    throw ApiError.unauthorized('Authentication required');
  }

  // Since req.user now contains the full PublicUser object, we can return it directly
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    username: req.user.username,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt,
  });
};

/**
 * PUT /users/me
 * Updates the authenticated user's profile
 */
const updateAuthenticatedUserProfileHandler: AsyncValidatedRequestHandler<
  any,
  any,
  UpdateUserProfileRequest
> = async (req, res) => {
  // The user object is added to the request by the requireAuthentication middleware
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const updateData = res.locals.validatedBody;

  // Update user profile
  const { id, email, username, createdAt, updatedAt } =
    await userService.updateUserProfile(req.user.id, updateData);

  res.status(200).json({
    id,
    email,
    username,
    createdAt,
    updatedAt,
  });
};

/**
 * PUT /users/me/password
 * Changes the authenticated user's password
 */
const changeAuthenticatedUserPasswordHandler: AsyncValidatedRequestHandler<
  any,
  any,
  ChangePasswordRequest
> = async (req, res) => {
  // The user object is added to the request by the requireAuthentication middleware
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const passwordData = res.locals.validatedBody;

  // Change user password
  await userService.changeUserPassword(req.user.id, passwordData);

  res.status(204).send();
};

// -- Exports --
export const getAuthenticatedUser = catchAsync(getAuthenticatedUserHandler);
export const updateAuthenticatedUserProfile = catchAsync(
  updateAuthenticatedUserProfileHandler
);
export const changeAuthenticatedUserPassword = catchAsync(
  changeAuthenticatedUserPasswordHandler
);
