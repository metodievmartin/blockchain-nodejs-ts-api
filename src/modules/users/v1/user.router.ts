import { Router } from 'express';

import * as userController from './user.controller';
import { requireAuthentication } from '../../../middlewares/auth.middleware';

const router = Router();

/**
 * GET /users/me
 * Returns the authenticated user's profile
 * Protected by authentication middleware
 */
router.get('/me', requireAuthentication, userController.getAuthenticatedUser);

export default router;
