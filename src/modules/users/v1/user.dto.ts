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
