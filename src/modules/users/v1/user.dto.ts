import { z } from 'zod';

import { type User } from '../../../../prisma/generated/client';

/**
 * PublicUser type - only includes non-sensitive user properties
 */
export type PublicUser = Pick<
  User,
  'id' | 'email' | 'username' | 'createdAt' | 'updatedAt'
>;

/**
 * Schema for validating public user data
 */
export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  username: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Reusable email schema with custom error messages
 */
export const emailSchema = z.email({
  error: ({ input }) =>
    input === undefined ? 'Email is required' : 'Invalid email address',
});

/**
 * Reusable username schema with validation rules and custom error messages
 */
export const usernameSchema = z
  .string({
    error: ({ input }) =>
      input === undefined
        ? 'Username is required'
        : 'Username should be a string',
  })
  .min(3, 'Username should be between 3 and 50 characters long')
  .max(50, 'Username should be between 3 and 50 characters long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, hyphens, and underscores'
  );

/**
 * Reusable password schema with validation rules and custom error messages
 */
export const strongPasswordSchema = z
  .string({
    error: ({ input }) =>
      input === undefined
        ? 'Password is required'
        : 'Password should be a string',
  })
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

/**
 * Schema for validating update user profile request
 */
export const updateUserProfileSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
});

/**
 * Type for update user profile request
 */
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
