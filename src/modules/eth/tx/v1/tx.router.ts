/**
 * Blockchain Router
 * ---------------------------------
 * Express router for blockchain endpoints
 */
import { Router } from 'express';

import * as txController from './tx.controller';

const router = Router();

// Transaction endpoints
router.get('/:address/transactions', txController.getTransactions);
router.get('/:address/balance', txController.getBalance);
router.get('/:address/coverage', txController.getAddressCoverage);
router.get('/:address/count', txController.getStoredTransactionCount);
router.get('/queue-info', txController.getQueueInfo);

export default router;
