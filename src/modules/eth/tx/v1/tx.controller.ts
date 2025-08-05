/**
 * Blockchain Controller
 * ---------------------------------
 * HTTP request handlers for blockchain endpoints
 */
import { Request, Response } from 'express';

import { type AsyncValidatedRequestHandler } from '../../../../types/request.types';

import {
  AddressParams,
  GetTransactionsQuery,
  GetTransactionsResponse,
} from './tx.dto';
import * as txService from './tx.service';
import logger from '../../../../config/logger';
import { getQueueStats } from '../../../../queue/client';
import { catchAsync } from '../../../../utils/catch-async';

/**
 * Get transactions for an address
 * GET /api/v1/eth/address/:address/transactions?from=123&to=456&page=1&limit=1000&order=asc
 */
const getTransactionsHandler: AsyncValidatedRequestHandler<
  AddressParams,
  GetTransactionsQuery
> = async (req, res) => {
  const { address } = res.locals.validatedParams; // Validated and transformed to checksum
  const query = res.locals.validatedQuery;

  logger.info('Paginated transaction request received', {
    address,
    query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const result = await txService.getTransactions(
    address,
    query.from,
    query.to,
    query.page,
    query.limit,
    query.order
  );

  const response: GetTransactionsResponse = {
    success: true,
    fromCache: result.fromCache,
    transactions: result.transactions,
    pagination: result.pagination,
    metadata: result.metadata,
  };

  res.json(response);
};

/**
 * Get balance for an address
 * GET /api/v1/eth/address/:address/balance
 */
const getBalanceHandler: AsyncValidatedRequestHandler<AddressParams> = async (
  req,
  res
) => {
  const { address } = res.locals.validatedParams; // Validated and transformed to checksum

  logger.info('Balance request received', {
    address,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const result = await txService.getBalance(address);

  res.json(result);
};

/**
 * Get stored transaction count for an address
 * GET /api/v1/eth/address/:address/count
 */
const getStoredTransactionCountHandler: AsyncValidatedRequestHandler<
  AddressParams
> = async (req, res) => {
  const { address } = res.locals.validatedParams; // Validated and transformed to checksum

  logger.info('Transaction count request received', {
    address,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const count = await txService.getStoredTransactionCount(address);

  res.json({
    count,
  });
};

export const getQueueInfo = catchAsync(async (req: Request, res: Response) => {
  res.json({
    data: await getQueueStats(),
  });
});

// -- Exports --
export const getTransactions = catchAsync(getTransactionsHandler);
export const getStoredTransactionCount = catchAsync(
  getStoredTransactionCountHandler
);
export const getBalance = catchAsync(getBalanceHandler);
