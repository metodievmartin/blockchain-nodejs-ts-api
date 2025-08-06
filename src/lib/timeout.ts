/**
 * Timeout Utilities
 * ---------------------------------
 * Utilities for adding timeout functionality to promises
 */

/**
 * Wraps a promise with a timeout mechanism
 *
 * Note: This implementation does not cancel the underlying operation.
 * The original promise will continue to execute in the background even
 * after the timeout is triggered. This is a limitation when working with
 * APIs that don't support cancellation (like ethers.js providers).
 *
 * @param promise - The promise to wrap with timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that resolves with the original result or rejects with timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timeout'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Creates a timeout error with consistent formatting
 */
export function createTimeoutError(
  operation: string,
  timeoutMs: number
): Error {
  return new Error(
    `Query Timeout: ${operation} timed out after ${timeoutMs}ms`
  );
}
