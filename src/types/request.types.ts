/**
 * Type-safe validated request handler types
 * ---------------------------------
 * Provides type safety and IntelliSense for validated request handlers
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Interface for validated locals with proper typing
 */
export interface ValidatedLocals<TParams = unknown, TQuery = unknown, TBody = unknown> {
  validatedParams?: TParams;
  validatedQuery?: TQuery;
  validatedBody?: TBody;
}

/**
 * Extended Response type with typed locals
 */
export interface ValidatedResponse<TParams = unknown, TQuery = unknown, TBody = unknown>
  extends Omit<Response, 'locals'> {
  locals: ValidatedLocals<TParams, TQuery, TBody> & Record<string, unknown>;
}

/**
 * Type-safe request handler for validated requests
 * Usage:
 * const handler: ValidatedRequestHandler<AddressParams> = (req, res) => {
 *   const { address } = res.locals.validatedParams; // Fully typed!
 * };
 */
export type ValidatedRequestHandler<TParams = unknown, TQuery = unknown, TBody = unknown> = (
  req: Request,
  res: ValidatedResponse<TParams, TQuery, TBody>,
  next: NextFunction
) => void | Promise<void>;

/**
 * Async version of ValidatedRequestHandler (for use with catchAsync)
 * This is the function you pass TO catchAsync, not the result of catchAsync
 */
export type AsyncValidatedRequestHandler<TParams = unknown, TQuery = unknown, TBody = unknown> = (
  req: Request,
  res: ValidatedResponse<TParams, TQuery, TBody>
) => Promise<void>;
