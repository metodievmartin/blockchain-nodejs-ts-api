/**
 * @swagger
 * /api/v1/eth/address/{address}/transactions:
 *   get:
 *     summary: Get transactions for an Ethereum address
 *     description: Retrieves transactions for a given Ethereum address with pagination and optional block range filtering
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum address (will be converted to checksum format)
 *         example: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"
 *       - in: query
 *         name: fromBlock
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Starting block number (defaults to contract creation block for contracts, 0 for EOAs)
 *         example: 1000000
 *       - in: query
 *         name: toBlock
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Ending block number (defaults to latest block)
 *         example: 2000000
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 1000
 *         description: Number of transactions per page
 *         example: 100
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionsResponse'
 *       400:
 *         description: Invalid address format or query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionsQueryValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/eth/address/{address}/balance:
 *   get:
 *     summary: Get balance for an Ethereum address
 *     description: Retrieves the current ETH balance for a given Ethereum address
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum address (will be converted to checksum format)
 *         example: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BalanceResponse'
 *       400:
 *         description: Invalid address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressParamValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/eth/address/{address}/count:
 *   get:
 *     summary: Get stored transaction count for an address
 *     description: Returns the number of transactions stored in the database for a given Ethereum address
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum address (will be converted to checksum format)
 *         example: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"
 *     responses:
 *       200:
 *         description: Transaction count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CountResponse'
 *       400:
 *         description: Invalid address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressParamValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/eth/address/queue-info:
 *   get:
 *     summary: Get background processing queue information (Development Only)
 *     description: |
 *       Returns detailed statistics about the background processing queue including waiting, active, completed, failed, and delayed jobs.
 *       
 *       **⚠️ Development Only**: This endpoint is only mounted in development environments and does not exist in production.
 *     tags: [Blockchain]
 *     responses:
 *       200:
 *         description: Queue information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueueInfoResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Export empty object to make this a valid module
export {};
