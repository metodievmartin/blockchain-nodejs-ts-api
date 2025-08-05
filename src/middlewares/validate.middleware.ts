import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

import { ApiError } from '../utils/api.error';

/**
 * Generic validation middleware that validates request body against a Zod schema
 * @param schema - The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateBody = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.body) {
      throw ApiError.badRequest(
        'Request body is missing or not a valid JSON object'
      );
    }

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      const flattened = z.flattenError(validationResult.error);
      throw ApiError.badRequest(
        'Invalid request body — please check your input',
        flattened.fieldErrors
      );
    }

    // Attach validated data back to the body with proper typing
    req.body = validationResult.data as z.infer<T>;
    next();
  };
};

/**
 * Generic validation middleware that validates request params against a Zod schema
 * @param schema - The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateParams = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.params) {
      throw ApiError.badRequest('Request params are missing');
    }

    const validationResult = schema.safeParse(req.params);

    if (!validationResult.success) {
      const flattened = z.flattenError(validationResult.error);
      throw ApiError.badRequest(
        'Invalid request parameters — please check your input',
        flattened.fieldErrors
      );
    }

    // Store validated and transformed data in res.locals for controllers to access
    res.locals.validatedParams = validationResult.data as z.infer<T>;
    next();
  };
};

/**
 * Generic validation middleware that validates request query against a Zod schema
 * @param schema - The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.query) {
      throw ApiError.badRequest('Request query is missing');
    }

    const validationResult = schema.safeParse(req.query);

    if (!validationResult.success) {
      const flattened = z.flattenError(validationResult.error);
      throw ApiError.badRequest(
        'Invalid query parameters — please check your input',
        flattened.fieldErrors
      );
    }

    // Store validated and transformed data in res.locals for controllers to access
    res.locals.validatedQuery = validationResult.data as z.infer<T>;
    next();
  };
};
