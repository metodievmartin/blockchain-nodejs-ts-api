import { Router } from 'express';

import * as txController from './tx.controller';
import {
  validateParams,
  validateQuery,
} from '../../../../middlewares/validate.middleware';
import appConfig from '../../../../config/app.config';
import { AddressParamsSchema, GetTransactionsQuerySchema } from './tx.dto';

const router = Router();

/*// GET /:address/transactions - Get transactions for address*/
router.get(
  '/:address/transactions',
  validateParams(AddressParamsSchema),
  validateQuery(GetTransactionsQuerySchema),
  txController.getTransactions
);

// GET /:address/balance - Get ETH balance for address
router.get(
  '/:address/balance',
  validateParams(AddressParamsSchema),
  txController.getBalance
);

// GET /:address/count - Get stored transaction count
router.get(
  '/:address/count',
  validateParams(AddressParamsSchema),
  txController.getStoredTransactionCount
);

// GET /queue-info - Queue statistics (dev only)
if (appConfig.nodeEnv === 'development') {
  router.get('/queue-info', txController.getQueueInfo);
}

export default router;
