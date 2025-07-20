import { type User } from '../../../../prisma/generated/client';

import { getOrCreateDB } from '../../../config/db';

const db = getOrCreateDB();

/**
 * Create a new user in the database
 */
export async function createUser(userData: {
  email: string;
  username: string;
  passwordHash: string;
}): Promise<User> {
  return db.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
    },
  });
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({
    where: { email },
  });
}

/**
 * Find user by username
 */
export async function findUserByUsername(
  username: string
): Promise<User | null> {
  return db.user.findUnique({
    where: { username },
  });
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  return db.user.findUnique({
    where: { id },
  });
}

/**
 * Check if a user exists by email or username
 */
export async function findUserByEmailOrUsername(
  email: string,
  username: string
): Promise<User | null> {
  return db.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });
}
