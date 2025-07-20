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
    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      const flattened = z.flattenError(validationResult.error);
      throw ApiError.badRequest('Validation failed', flattened.fieldErrors);
    }

    // Attach validated data back to the body with proper typing
    req.body = validationResult.data as z.infer<T>;
    next();
  };
};
