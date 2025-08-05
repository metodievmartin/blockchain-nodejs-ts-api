/**
 * Blockchain Router
 * ---------------------------------
 * Express router for blockchain endpoints
 */
import { Router } from 'express';

import { AddressParamsSchema } from './tx.dto';
import * as txController from './tx.controller';
import { validateParams } from '../../../../middlewares/validate.middleware';

const router = Router();

// Transaction endpoints
router.get(
  '/:address/transactions',
  validateParams(AddressParamsSchema),
  txController.getTransactions
);
router.get(
  '/:address/balance',
  validateParams(AddressParamsSchema),
  txController.getBalance
);
router.get(
  '/:address/coverage',
  validateParams(AddressParamsSchema),
  txController.getAddressCoverage
);
router.get(
  '/:address/count',
  validateParams(AddressParamsSchema),
  txController.getStoredTransactionCount
);
router.get('/queue-info', txController.getQueueInfo);

export default router;
