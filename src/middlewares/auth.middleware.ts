import type { Request, Response, NextFunction } from 'express';

import { ApiError } from '../utils/api.error';
import { catchAsync } from '../utils/catch-async';
import { verifyAccessToken } from '../modules/auth/v1/auth.service';
import { fetchPublicUser } from '../modules/users/v1/user.service';
import { type PublicUser } from '../modules/users/v1/user.dto';

// Extend the Express Request type to include user property
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

/**
 * Middleware to require authentication via JWT access token
 * Extracts the user ID from the token, verifies the user exists,
 * and adds the full PublicUser object to the request
 */
export const requireAuthentication = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Invalid authentication header format');
    }

    const token = parts[1];

    // Verify the token using auth service
    const decoded = verifyAccessToken(token);

    if (!decoded.userId) {
      throw ApiError.unauthorized('Malformed authentication token');
    }

    try {
      req.user = await fetchPublicUser(decoded.userId);
    } catch (err) {
      throw ApiError.unauthorized(
        'User associated with this token could not be found'
      );
    }

    next();
  }
);
