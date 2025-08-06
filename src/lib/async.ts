import { RequestHandler } from 'express';

/**
 * Wraps async route handlers to automatically catch errors and pass them to the next middleware
 * @param fn The async route handler function
 * @returns A wrapped function that catches any errors and passes them to next()
 */
export const catchAsync =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
