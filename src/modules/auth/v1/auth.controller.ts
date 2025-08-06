import type {
  LoginRequestBody,
  RegisterRequestBody,
  RefreshTokenRequestBody,
  LogoutRequestBody,
} from './auth.dto';
import { type AsyncValidatedRequestHandler } from '../../../types/request.types';

import * as authService from './auth.service';
import { catchAsync } from '../../../lib/async';

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 */
const registerHandler: AsyncValidatedRequestHandler<
  any,
  any,
  RegisterRequestBody
> = async (req, res) => {
  const registerData = res.locals.validatedBody;

  const { id, email, username, createdAt } =
    await authService.registerUser(registerData);

  res.status(201).json({
    id,
    email,
    username,
    createdAt,
  });
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
const loginHandler: AsyncValidatedRequestHandler<
  any,
  any,
  LoginRequestBody
> = async (req, res) => {
  const loginData = res.locals.validatedBody;

  const { accessToken, refreshToken, expiresIn } =
    await authService.loginUser(loginData);

  res.status(200).json({
    accessToken,
    refreshToken,
    expiresIn,
  });
};

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh
 */
const refreshTokenHandler: AsyncValidatedRequestHandler<
  any,
  any,
  RefreshTokenRequestBody
> = async (req, res) => {
  const { refreshToken } = res.locals.validatedBody;

  const { accessToken, expiresIn } =
    await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    accessToken,
    expiresIn,
  });
};

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
const logoutHandler: AsyncValidatedRequestHandler<
  any,
  any,
  LogoutRequestBody
> = async (req, res) => {
  const { refreshToken } = res.locals.validatedBody;

  await authService.logoutUser(refreshToken);

  res.status(204).send();
};

/**
 * Logout from all devices
 * @route POST /api/v1/auth/logout-all
 */
const logoutAllHandler: AsyncValidatedRequestHandler<any, any, any> = async (
  req,
  res
) => {
  // User ID is added by the authentication middleware
  await authService.logoutUserFromAllSessions(req.user.id);

  res.status(204).send();
};

// -- Exports --
export const register = catchAsync(registerHandler);
export const login = catchAsync(loginHandler);
export const refreshToken = catchAsync(refreshTokenHandler);
export const logout = catchAsync(logoutHandler);
export const logoutAll = catchAsync(logoutAllHandler);
