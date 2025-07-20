import { type User } from '../../../../prisma/generated/client';

import * as authRepository from './auth.repository';
import { ApiError } from '../../../utils/api.error';
import { hashPassword, comparePasswords } from '../../shared/auth';
import {
  RegisterRequestBody,
  RegisterResponse,
  LoginRequestBody,
  LoginResponse,
} from './auth.dto';

/**
 * Register a new user
 */
export async function register(
  userData: RegisterRequestBody
): Promise<RegisterResponse> {
  const { email, username, password } = userData;

  // Check if user already exists
  const existingUser = await authRepository.findUserByEmailOrUsername(
    email,
    username
  );

  if (existingUser) {
    const property = email === existingUser.email ? 'email' : 'username';
    throw ApiError.conflict(`User with this ${property} already exists`);
  }

  // Hash the password using shared helper
  const passwordHash = await hashPassword(password);

  // Create the user
  const newUser = await authRepository.createUser({
    email,
    username,
    passwordHash,
  });

  // Return user data without password hash
  return {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    createdAt: newUser.createdAt.toISOString(),
  };
}

/**
 * Login user
 */
export async function login(
  loginData: LoginRequestBody
): Promise<LoginResponse> {
  const { email, password } = loginData;

  // Keep the message generic without revealing too many details
  const invalidCredentialsMsg = 'Incorrect email or password';

  // Find user by email
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw ApiError.unauthorized(invalidCredentialsMsg);
  }

  // Verify password using shared helper
  const isPasswordValid = await comparePasswords(password, user.passwordHash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized(invalidCredentialsMsg);
  }

  // Return JWT tokens placeholders for now
  return {
    accessToken: 'jwt_token_placeholder',
    refreshToken: 'refresh_token_placeholder',
    expiresIn: 3600,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  return authRepository.findUserById(id);
}
