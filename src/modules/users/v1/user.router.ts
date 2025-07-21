import { Router } from 'express';

import * as userController from './user.controller';
import { requireAuthentication } from '../../../middlewares/auth.middleware';
import { validateBody } from '../../../middlewares/validate.middleware';
import { updateUserProfileSchema } from './user.dto';

const router = Router();

/**
 * GET /users/me
 * Returns the authenticated user's profile
 * Protected by authentication middleware
 */
router.get('/me', requireAuthentication, userController.getAuthenticatedUser);

/**
 * PUT /users/me
 * Updates the authenticated user's profile (email and/or username)
 * Protected by authentication middleware
 */
router.put(
  '/me',
  requireAuthentication,
  validateBody(updateUserProfileSchema),
  userController.updateAuthenticatedUserProfile
);

export default router;
