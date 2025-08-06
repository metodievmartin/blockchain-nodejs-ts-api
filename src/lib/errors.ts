/**
 * ---------------------------------
 * Error Classes Library
 * ---------------------------------
 * Combined error classes for consistent error handling across the application
 */
import jwt from 'jsonwebtoken';

/**
 * Custom error class for API errors with status codes
 * Used to throw errors that will be properly formatted in responses
 *
 * This class is designed for safe-to-display errors that won't leak any internal
 * system information. Only use this for user-facing error messages that are
 * appropriate to show in API responses.
 */
export class ApiError extends Error {
  public statusCode: number;
  public errorName: string;
  public details?: Record<string, unknown | null>;

  constructor(
    statusCode: number,
    errorName: string,
    message: string,
    details?: Record<string, unknown | null>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorName = errorName;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(
    message: string = 'Invalid or malformed request data',
    details?: Record<string, unknown | null>
  ) {
    return new ApiError(400, 'Bad Request', message, details);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(
    message: string = 'Invalid credentials',
    details?: Record<string, unknown | null>
  ) {
    return new ApiError(401, 'Unauthorized', message, details);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(
    message: string = 'Insufficient permissions',
    details?: Record<string, unknown | null>
  ) {
    return new ApiError(403, 'Forbidden', message, details);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(
    message: string = 'Resource not found',
    details?: Record<string, unknown | null>
  ) {
    return new ApiError(404, 'Not Found', message, details);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(
    message: string = 'Resource conflict',
    details?: Record<string, unknown | null>
  ) {
    return new ApiError(409, 'Conflict', message, details);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessableEntity(
    message: string = 'Unable to process the request',
    details?: Record<string, unknown | null>
  ) {
    return new ApiError(422, 'Unprocessable Entity', message, details);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(
    message: string = 'Something went wrong. Please try again later.',
    details?: Record<string, unknown | null>
  ) {
    return new ApiError(500, 'Internal Server Error', message, details);
  }
}

/**
 * Custom error class for JWT token errors
 *
 * It's wrapping jwt.TokenExpiredError, jwt.NotBeforeError, and jwt.JsonWebTokenError
 * and adding the token type
 */
export class JwtTokenError extends Error {
  constructor(
    public originalError:
      | jwt.TokenExpiredError
      | jwt.NotBeforeError
      | jwt.JsonWebTokenError,
    public tokenType: 'access' | 'refresh'
  ) {
    super(originalError.message);
  }
}
