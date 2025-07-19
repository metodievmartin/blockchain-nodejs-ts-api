import { Request, Response, NextFunction } from 'express';

import appConfig from '../config/app.config';
import { ApiError } from '../utils/api.error';

type ErrorResponse = {
  error: string;
  message: string;
  details?: Record<string, unknown | null>;
  stack?: string;
};

/**
 * Central error handling middleware
 * Catches errors from routes and sends appropriate responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isApiError = err instanceof ApiError;

  // Default status code and message for all not customer facing errors
  let statusCode = 500;
  let message = 'Something went wrong. Please try again later.';
  let errorType = 'Internal Server Error';

  // If the error is an API error, use its status code and message
  if (isApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorType = err.errorName;
  }

  const response: ErrorResponse = {
    error: errorType,
    message: message,
  };

  // Add details if available (for ApiError or other structured errors)
  if (isApiError && err.details) {
    response.details = err.details;
  }

  // Useful for debugging in development
  if (appConfig.isDev) {
    console.error(err);
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
