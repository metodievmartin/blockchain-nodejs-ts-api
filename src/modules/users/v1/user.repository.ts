import { type PublicUser, type UpdateUserProfileRequest } from './user.dto';
import {
  type User,
  type PrismaClient,
  type Prisma,
} from '../../../../prisma/generated/client';

import { getOrCreateDB } from '../../../config/db';

const db = getOrCreateDB();

// Type for client parameter that can be either PrismaClient or TransactionClient
type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Create a new user in the database
 * Returns only non-sensitive user properties
 */
export async function createUser(userData: {
  email: string;
  username: string;
  passwordHash: string;
}): Promise<PublicUser> {
  return db.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true,
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
export async function getPublicUserById(
  id: string
): Promise<PublicUser | null> {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Update user profile
 * @param userId - The ID of the user to update
 * @param data - The data to update (email and/or username)
 * @returns The updated public user data
 */
export async function updateUser(
  userId: string,
  data: UpdateUserProfileRequest
): Promise<PublicUser> {
  return db.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Update user password
 * @param userId - The ID of the user to update
 * @param passwordHash - The new hashed password
 * @param client - Optional Prisma client or transaction client
 * @returns The updated public user data
 */
export async function updateUserPassword(
  userId: string,
  passwordHash: string,
  client: DbClient = db
): Promise<PublicUser> {
  return client.user.update({
    where: { id: userId },
    data: {
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
