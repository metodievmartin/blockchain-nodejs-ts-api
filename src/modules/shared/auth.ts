import bcrypt from 'bcrypt';

import appConfig from '../../config/app.config';

/**
 * Hashes a password using bcrypt with a predefined number of salt rounds
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password string
 */
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(appConfig.security.saltRounds);
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password
 * @param enteredPassword - The plain text password to check
 * @param hashedPassword - The hashed password to compare against
 * @returns A promise that resolves to a boolean indicating if the passwords match
 */
export const comparePasswords = async (
  enteredPassword: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};
