/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get authenticated user profile
 *     description: Returns the authenticated user's profile information. Requires Bearer token authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   enum: ["Invalid access token", "Expired access token"]
 *                   example: "Expired access token"
 *                 stack:
 *                   type: string
 *                   description: "Error stack trace (only present in development)"
 *                   example: "Error: Expired access token\n    at AuthMiddleware.validateToken..."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update authenticated user profile
 *     description: Updates the authenticated user's profile (email and/or username). Requires Bearer token authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateUserProfileValidationError'
 *       401:
 *         description: Invalid or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   enum: ["Invalid access token", "Expired access token"]
 *                   example: "Invalid access token"
 *                 stack:
 *                   type: string
 *                   description: "Error stack trace (only present in development)"
 *                   example: "Error: Invalid access token\n    at AuthMiddleware.validateToken..."
 *       409:
 *         description: Email or username already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConflictError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/me/password:
 *   put:
 *     summary: Change user password
 *     description: Changes the authenticated user's password. Requires Bearer token authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChangePasswordValidationError'
 *       401:
 *         description: Invalid access token or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *                 message:
 *                   type: string
 *                   enum: ["Invalid access token", "Expired access token", "Current password is incorrect"]
 *                   example: "Current password is incorrect"
 *                 stack:
 *                   type: string
 *                   description: "Error stack trace (only present in development)"
 *                   example: "Error: Current password is incorrect\n    at UserService.changePassword..."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Export empty object to make this a valid module
export {};
