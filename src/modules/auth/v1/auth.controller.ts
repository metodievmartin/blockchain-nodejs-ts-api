import type { Request, Response } from 'express';

import type {
  LoginRequestBody,
  RegisterRequestBody,
  RefreshTokenRequestBody,
  LogoutRequestBody,
} from './auth.dto';

import * as authService from './auth.service';
import { catchAsync } from '../../../utils/catch-async';

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 */
export const register = catchAsync(
  async (
    req: Request<{}, any, RegisterRequestBody>,
    res: Response
  ): Promise<void> => {
    // Middleware already validates request body
    const { id, email, username, createdAt } = await authService.registerUser(
      req.body
    );

    res.status(201).json({
      id,
      email,
      username,
      createdAt,
    });
  }
);

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
export const login = catchAsync(
  async (
    req: Request<{}, any, LoginRequestBody>,
    res: Response
  ): Promise<void> => {
    // Middleware already validates request body
    const { accessToken, refreshToken, expiresIn } =
      await authService.loginUser(req.body);

    res.status(200).json({
      accessToken,
      refreshToken,
      expiresIn,
    });
  }
);

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh
 */
export const refreshToken = catchAsync(
  async (
    req: Request<{}, any, RefreshTokenRequestBody>,
    res: Response
  ): Promise<void> => {
    // Middleware already validates request body
    const { accessToken, expiresIn } = await authService.refreshAccessToken(
      req.body.refreshToken
    );

    res.status(200).json({
      accessToken,
      expiresIn,
    });
  }
);

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
export const logout = catchAsync(
  async (
    req: Request<{}, any, LogoutRequestBody>,
    res: Response
  ): Promise<void> => {
    // Middleware already validates request body
    await authService.logoutUser(req.body.refreshToken);

    res.status(204).send();
  }
);

/**
 * Logout from all devices
 * @route POST /api/v1/auth/logout-all
 */
export const logoutAll = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // User ID is added by the authentication middleware
    await authService.logoutUserFromAllSessions(req.user.id);

    res.status(204).send();
  }
);
