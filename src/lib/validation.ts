/**
 * Utility functions for Zod schema validation
 */

/**
 * Helper function to generate error messages for required string fields
 *
 * Error Messages:
 * - If input is undefined: `'Field is required'`
 * - If input is present but not a string: `'Field should be a string'`
 *
 * @param label The field label to use in error messages (defaults to 'Field')
 * @returns An error function for Zod string validation
 */
export const requiredStringError = (label: string = 'Field') => ({
  error: ({ input }: { input: unknown }) =>
    input === undefined
      ? `${label} is required`
      : `${label} should be a string`,
});

/**
 * Regex pattern for validating usernames
 * Allows only letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_)
 * This ensures usernames are URL-safe and don't contain special characters
 * that could cause issues in URLs, databases, or display contexts
 */
export const VALID_USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Error message for invalid username format
 */
export const INVALID_USERNAME_FORMAT_MESSAGE =
  'Username can only contain letters, numbers, hyphens, and underscores';

/**
 * Regex pattern for validating strong passwords
 * Requires at least:
 * - One lowercase letter (a-z)
 * - One uppercase letter (A-Z)
 * - One digit (0-9)
 * - One special character (!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)
 *
 * This pattern enforces password complexity to improve security
 */
export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/;

/**
 * Error message for invalid password format
 */
export const INVALID_PASSWORD_FORMAT_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
