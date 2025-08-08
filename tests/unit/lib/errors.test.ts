import jwt from 'jsonwebtoken';
import { ApiError, JwtTokenError } from '../../../src/lib/errors';

describe('Error Classes', () => {
  describe('ApiError', () => {
    describe('constructor', () => {
      it('should create error with all properties', () => {
        const details = { field: 'value' };
        const error = new ApiError(400, 'Bad Request', 'Test message', details);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(400);
        expect(error.errorName).toBe('Bad Request');
        expect(error.message).toBe('Test message');
        expect(error.details).toEqual(details);
        expect(error.stack).toBeDefined();
      });

      it('should create error without details', () => {
        const error = new ApiError(
          500,
          'Internal Server Error',
          'Server error'
        );

        expect(error.statusCode).toBe(500);
        expect(error.errorName).toBe('Internal Server Error');
        expect(error.message).toBe('Server error');
        expect(error.details).toBeUndefined();
      });
    });

    describe('static factory methods', () => {
      it('should create badRequest error with default message', () => {
        const error = ApiError.badRequest();

        expect(error.statusCode).toBe(400);
        expect(error.errorName).toBe('Bad Request');
        expect(error.message).toBe('Invalid or malformed request data');
        expect(error.details).toBeUndefined();
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });

      it('should create badRequest error with custom message and details', () => {
        const details = { field: 'email' };
        const error = ApiError.badRequest('Custom message', details);

        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Custom message');
        expect(error.details).toEqual(details);
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });

      it('should create unauthorized error', () => {
        const error = ApiError.unauthorized('Invalid token');

        expect(error.statusCode).toBe(401);
        expect(error.errorName).toBe('Unauthorized');
        expect(error.message).toBe('Invalid token');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });

      it('should create forbidden error', () => {
        const error = ApiError.forbidden();

        expect(error.statusCode).toBe(403);
        expect(error.errorName).toBe('Forbidden');
        expect(error.message).toBe('Insufficient permissions');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });

      it('should create notFound error', () => {
        const error = ApiError.notFound('User not found');

        expect(error.statusCode).toBe(404);
        expect(error.errorName).toBe('Not Found');
        expect(error.message).toBe('User not found');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });

      it('should create conflict error', () => {
        const error = ApiError.conflict();

        expect(error.statusCode).toBe(409);
        expect(error.errorName).toBe('Conflict');
        expect(error.message).toBe('Resource conflict');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });

      it('should create unprocessableEntity error', () => {
        const error = ApiError.unprocessableEntity('Validation failed');

        expect(error.statusCode).toBe(422);
        expect(error.errorName).toBe('Unprocessable Entity');
        expect(error.message).toBe('Validation failed');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });

      it('should create internal error', () => {
        const error = ApiError.internal();

        expect(error.statusCode).toBe(500);
        expect(error.errorName).toBe('Internal Server Error');
        expect(error.message).toBe(
          'Something went wrong. Please try again later.'
        );
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
      });
    });
  });

  describe('JwtTokenError', () => {
    describe('constructor', () => {
      it('should create error with TokenExpiredError', () => {
        const originalError = new jwt.TokenExpiredError(
          'jwt expired',
          new Date()
        );
        const jwtError = new JwtTokenError(originalError, 'access');

        expect(jwtError).toBeInstanceOf(Error);
        expect(jwtError.originalError).toBe(originalError);
        expect(jwtError.tokenType).toBe('access');
        expect(jwtError.message).toBe('jwt expired');
      });

      it('should create error with JsonWebTokenError', () => {
        const originalError = new jwt.JsonWebTokenError('invalid token');
        const jwtError = new JwtTokenError(originalError, 'refresh');

        expect(jwtError.originalError).toBe(originalError);
        expect(jwtError.tokenType).toBe('refresh');
        expect(jwtError.message).toBe('invalid token');
      });

      it('should create error with NotBeforeError', () => {
        const originalError = new jwt.NotBeforeError(
          'jwt not active',
          new Date()
        );
        const jwtError = new JwtTokenError(originalError, 'access');

        expect(jwtError.originalError).toBe(originalError);
        expect(jwtError.tokenType).toBe('access');
        expect(jwtError.message).toBe('jwt not active');
      });
    });

    describe('token types', () => {
      it('should handle both access and refresh token types', () => {
        const originalError = new jwt.JsonWebTokenError('test');
        
        const accessTokenError = new JwtTokenError(originalError, 'access');
        expect(accessTokenError.tokenType).toBe('access');
        expect(accessTokenError).toBeInstanceOf(Error);
        expect(accessTokenError).toBeInstanceOf(JwtTokenError);
        
        const refreshTokenError = new JwtTokenError(originalError, 'refresh');
        expect(refreshTokenError.tokenType).toBe('refresh');
        expect(refreshTokenError).toBeInstanceOf(Error);
        expect(refreshTokenError).toBeInstanceOf(JwtTokenError);
      });
    });
  });
});
