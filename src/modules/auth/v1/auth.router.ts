import { Router } from 'express';

import * as authController from './auth.controller';
import { validateBody } from '../../../middlewares/validate.middleware';
import { RegisterRequestSchema, LoginRequestSchema } from './auth.dto';

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

export default router;
