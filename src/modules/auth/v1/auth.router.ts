import { Router } from 'express';

import * as authController from './auth.controller';
import { validateBody } from '../../../middlewares/validate.middleware';
import { requireAuthentication } from '../../../middlewares/auth.middleware';
import { 
  RegisterRequestSchema, 
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  LogoutRequestSchema
} from './auth.dto';

const router = Router();

/**
 * POST /register
 * Register a new user
 */
router.post('/register', validateBody(RegisterRequestSchema), authController.register);

/**
 * POST /login
 * Login user
 */
router.post('/login', validateBody(LoginRequestSchema), authController.login);

/**
 * POST /refresh
 * Refresh access token
 */
router.post('/refresh', validateBody(RefreshTokenRequestSchema), authController.refreshToken);

/**
 * POST /logout
 * Logout user
 * Protected by authentication middleware
 */
router.post('/logout', requireAuthentication, validateBody(LogoutRequestSchema), authController.logout);

/**
 * POST /logout-all
 * Logout from all devices
 * Protected by authentication middleware
 */
router.post('/logout-all', requireAuthentication, authController.logoutAll);

export default router;
