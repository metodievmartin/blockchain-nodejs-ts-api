import type { Request, Response } from 'express';
import type { LoginRequestBody, RegisterRequestBody } from './auth.dto';

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
    const newUser = await authService.register(req.body);

    res.status(201).json(newUser);
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
    const loginResult = await authService.login(req.body);

    res.status(200).json(loginResult);
  }
);
