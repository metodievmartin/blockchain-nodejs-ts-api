import { withTimeout, createTimeoutError } from '../../../src/lib/timeout';

describe('Timeout Utilities', () => {
  describe('createTimeoutError', () => {
    it('should create error with correct message format', () => {
      const error = createTimeoutError('API call', 5000);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Query Timeout: API call timed out after 5000ms');
    });

    it('should handle different operation names', () => {
      const error1 = createTimeoutError('database query', 3000);
      const error2 = createTimeoutError('blockchain request', 10000);
      
      expect(error1.message).toBe('Query Timeout: database query timed out after 3000ms');
      expect(error2.message).toBe('Query Timeout: blockchain request timed out after 10000ms');
    });

    it('should handle zero timeout', () => {
      const error = createTimeoutError('instant operation', 0);
      
      expect(error.message).toBe('Query Timeout: instant operation timed out after 0ms');
    });

    it('should handle empty operation name', () => {
      const error = createTimeoutError('', 1000);
      
      expect(error.message).toBe('Query Timeout:  timed out after 1000ms');
    });
  });

  describe('withTimeout', () => {
    describe('successful operations', () => {
      it('should resolve with promise result when promise completes before timeout', async () => {
        const fastPromise = Promise.resolve('success');
        
        const result = await withTimeout(fastPromise, 1000);
        
        expect(result).toBe('success');
      });

      it('should resolve with different data types', async () => {
        const complexData = { id: 1, name: 'test', items: [1, 2, 3] };
        const dataPromise = Promise.resolve(complexData);
        const undefinedPromise = Promise.resolve(undefined);
        const nullPromise = Promise.resolve(null);
        
        expect(await withTimeout(dataPromise, 1000)).toEqual(complexData);
        expect(await withTimeout(undefinedPromise, 1000)).toBeUndefined();
        expect(await withTimeout(nullPromise, 1000)).toBeNull();
      });
    });

    describe('timeout scenarios', () => {
      it('should reject with timeout error when promise takes too long', async () => {
        const slowPromise = new Promise(resolve => setTimeout(() => resolve('too late'), 200));
        
        await expect(withTimeout(slowPromise, 100)).rejects.toThrow('Operation timeout');
      });

      it('should use custom error message for timeout', async () => {
        const slowPromise = new Promise(resolve => setTimeout(() => resolve('result'), 200));
        const customMessage = 'Custom timeout message';
        
        await expect(withTimeout(slowPromise, 100, customMessage)).rejects.toThrow(customMessage);
      });

      it('should handle zero timeout with immediate resolution', async () => {
        const promise = Promise.resolve('immediate');
        
        const result = await withTimeout(promise, 0);
        expect(result).toBe('immediate');
      });
    });

    describe('promise rejection scenarios', () => {
      it('should propagate original promise rejection when it rejects before timeout', async () => {
        const originalError = new Error('Original error');
        const rejectingPromise = Promise.reject(originalError);
        
        await expect(withTimeout(rejectingPromise, 1000)).rejects.toThrow('Original error');
      });

      it('should prioritize timeout over slow rejection', async () => {
        const slowRejectingPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Slow rejection')), 200)
        );
        
        await expect(withTimeout(slowRejectingPromise, 100)).rejects.toThrow('Operation timeout');
      });
    });

    describe('edge cases', () => {
      it('should handle very large timeout values', async () => {
        const fastPromise = Promise.resolve('quick result');
        
        const result = await withTimeout(fastPromise, Number.MAX_SAFE_INTEGER);
        
        expect(result).toBe('quick result');
      });

      it('should handle promises that resolve exactly at timeout boundary', async () => {
        const boundaryPromise = new Promise(resolve => 
          setTimeout(() => resolve('boundary result'), 50)
        );
        
        const result = await withTimeout(boundaryPromise, 100);
        expect(result).toBe('boundary result');
      });
    });
  });
});
