import { type User } from '../../../../prisma/generated/client';
import { type PublicUser } from './user.dto';

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
 * Find user by email or username
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

/**
 * Get public user data by ID
 * Returns only non-sensitive user properties
 */
export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
