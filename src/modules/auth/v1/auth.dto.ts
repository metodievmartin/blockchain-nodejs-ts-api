import { z } from 'zod';

import {
  emailSchema,
  usernameSchema,
  strongPasswordSchema,
} from '../../users/v1/user.dto';
import { requiredStringError } from '../../../lib/validation';

/**
 * Registration DTOs
 */
export const RegisterRequestSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: strongPasswordSchema,
});

export type RegisterRequestBody = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  createdAt: z.string(), // ISO timestamp string
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

/**
 * Login DTOs
 */
export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: z.string(requiredStringError('Password')),
});

export type LoginRequestBody = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Refresh Token DTOs
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(requiredStringError('Refresh token')),
});

export type RefreshTokenRequestBody = z.infer<typeof RefreshTokenRequestSchema>;

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

/**
 * Logout DTOs
 */
export const LogoutRequestSchema = z.object({
  refreshToken: z.string(requiredStringError('Refresh token')),
});

export type LogoutRequestBody = z.infer<typeof LogoutRequestSchema>;
