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
 * Schema for validating update user profile request
 */
export const updateUserProfileSchema = z.object({
  email: z.email({
    error: ({ input }) =>
      input === undefined ? 'Email is required' : 'Invalid email address',
  }),
  username: z
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
    ),
});

/**
 * Type for update user profile request
 */
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
