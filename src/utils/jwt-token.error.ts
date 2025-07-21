import jwt from 'jsonwebtoken';

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
