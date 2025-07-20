import { z } from 'zod';

/**
 * Registration DTOs
 */
export const RegisterRequestSchema = z.object({
  email: z.email('Invalid email address'),
  username: z
    .string('Username should be a string')
    .min(3, 'Username should be between 3 and 50 characters long')
    .max(50, 'Username should be between 3 and 50 characters long')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores'
    ),
  password: z
    .string('Password should be a string')
    .min(8, 'Password should be at least 8 characters long')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must include at least one special character'
    ),
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
  email: z.email('Invalid email address'),
  password: z.string('Password should be a string'),
});

export type LoginRequestBody = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
