/**
 * Blockchain Router
 * ---------------------------------
 * Express router for blockchain endpoints
 */
import { Router } from 'express';

import * as blockchainController from './blockchain.controller';

const router = Router();

// Transaction endpoints
router.get('/address/:address/transactions', blockchainController.getTransactions);
router.get('/address/:address/balance', blockchainController.getBalance);
router.get('/address/:address/coverage', blockchainController.getCoverage);
router.get('/address/:address/count', blockchainController.getTransactionCount);

export default router;
