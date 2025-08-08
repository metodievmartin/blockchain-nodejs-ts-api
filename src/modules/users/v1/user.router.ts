import { Router } from 'express';

import * as userController from './user.controller';
import { validateBody } from '../../../middlewares/validate.middleware';
import { updateUserProfileSchema, changePasswordSchema } from './user.dto';
import { requireAuthentication } from '../../../middlewares/auth.middleware';

const router = Router();

// GET /me - Get user profile (requires auth)
router.get('/me', requireAuthentication, userController.getAuthenticatedUser);

// PUT /me - Update user profile (requires auth)
router.put(
  '/me',
  requireAuthentication,
  validateBody(updateUserProfileSchema),
  userController.updateAuthenticatedUserProfile
);

// PUT /me/password - Change password (requires auth)
router.put(
  '/me/password',
  requireAuthentication,
  validateBody(changePasswordSchema),
  userController.changeAuthenticatedUserPassword
);

export default router;
