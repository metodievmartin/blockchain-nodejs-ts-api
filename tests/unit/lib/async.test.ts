import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../../src/lib/async';

describe('Async Utilities', () => {
  describe('catchAsync', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should call the wrapped function with req, res, next', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = catchAsync(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not call next() when async function resolves successfully', async () => {
      const mockHandler = jest.fn().mockResolvedValue('success');
      const wrappedHandler = catchAsync(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() with error when async function rejects', async () => {
      const testError = new Error('Test error');
      const mockHandler = jest.fn().mockRejectedValue(testError);
      const wrappedHandler = catchAsync(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should handle synchronous errors thrown in async function', async () => {
      const testError = new Error('Sync error');
      const mockHandler = jest.fn().mockImplementation(async () => {
        throw testError;
      });
      const wrappedHandler = catchAsync(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should handle non-Error rejections', async () => {
      const stringError = 'String error';
      const mockHandler = jest.fn().mockRejectedValue(stringError);
      const wrappedHandler = catchAsync(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(stringError);
    });

    it('should work with handlers that return promises', async () => {
      const mockHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      });
      const wrappedHandler = catchAsync(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with handlers that return non-promise values', async () => {
      const mockHandler = jest.fn().mockReturnValue('sync result');
      const wrappedHandler = catchAsync(mockHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
