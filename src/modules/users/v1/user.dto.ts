import { z } from 'zod';

import { type User } from '../../../../prisma/generated/client';

import {
  requiredStringError,
  VALID_USERNAME_PATTERN,
  INVALID_USERNAME_FORMAT_MESSAGE,
  STRONG_PASSWORD_PATTERN,
  INVALID_PASSWORD_FORMAT_MESSAGE,
} from '../../../utils/zod.utils';

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
  .string(requiredStringError('Username'))
  .min(3, 'Username should be between 3 and 50 characters long')
  .max(50, 'Username should be between 3 and 50 characters long')
  .regex(VALID_USERNAME_PATTERN, INVALID_USERNAME_FORMAT_MESSAGE);

/**
 * Reusable password schema with validation rules and custom error messages
 */
export const strongPasswordSchema = z
  .string(requiredStringError('Password'))
  .min(8, 'Password must be at least 8 characters long')
  .regex(STRONG_PASSWORD_PATTERN, INVALID_PASSWORD_FORMAT_MESSAGE);

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
