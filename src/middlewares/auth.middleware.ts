import type { Request, Response, NextFunction } from 'express';

import { ApiError } from '../utils/api.error';
import { catchAsync } from '../utils/catch-async';
import { verifyAccessToken } from '../modules/auth/v1/auth.service';

// Extend the Express Request type to include user property
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

/**
 * Middleware to require authentication via JWT access token
 * Extracts the user ID from the token and adds it to the request object
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
      throw ApiError.unauthorized('Authentication required');
    }

    const token = parts[1];

    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Verify the token using auth service
    const decoded = verifyAccessToken(token);

    // Add user ID to request object
    req.user = {
      id: decoded.userId,
    };

    next();
  }
);
