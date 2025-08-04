/**
 * Blockchain Controller
 * ---------------------------------
 * HTTP request handlers for blockchain endpoints
 */
import { z } from 'zod';
import { Request, Response } from 'express';

import { catchAsync } from '../../../../utils/catch-async';
import { ApiError } from '../../../../utils/api.error';
import * as txService from './tx.service';
import {
  AddressParamsSchema,
  GetCoverageResponse,
  GetTransactionsQuerySchema,
  GetTransactionsResponse,
} from './tx.dto';
import logger from '../../../../config/logger';
import { getQueueStats } from '../../../../queue/client';

/**
 * Get transactions for an address
 * GET /api/v1/eth/address/:address/transactions?from=123&to=456&page=1&limit=1000&order=asc
 */
export const getTransactions = catchAsync(
  async (req: Request, res: Response) => {
    // Validate path parameters
    const addressResult = AddressParamsSchema.safeParse(req.params);
    if (!addressResult.success) {
      throw ApiError.badRequest(
        'Invalid address parameters',
        z.flattenError(addressResult.error)
      );
    }

    const { address } = addressResult.data;

    // Validate query parameters
    const queryResult = GetTransactionsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw ApiError.badRequest(
        'Invalid query parameters',
        z.flattenError(queryResult.error)
      );
    }

    const query = queryResult.data;

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
  }
);

/**
 * Get balance for an address
 * GET /api/v1/eth/address/:address/balance
 */
export const getBalance = catchAsync(async (req: Request, res: Response) => {
  const addressResult = AddressParamsSchema.safeParse(req.params);
  if (!addressResult.success) {
    throw ApiError.badRequest(
      'Invalid address parameters',
      z.flattenError(addressResult.error)
    );
  }
  const { address } = addressResult.data;

  logger.info('Balance request received', {
    address,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const result = await txService.getBalance(address);

  res.json(result);
});

/**
 * Get address coverage
 * GET /api/v1/eth/address/:address/coverage
 */
export const getAddressCoverage = catchAsync(
  async (req: Request, res: Response) => {
    const addressResult = AddressParamsSchema.safeParse(req.params);
    if (!addressResult.success) {
      throw ApiError.badRequest(
        'Invalid address parameters',
        z.flattenError(addressResult.error)
      );
    }
    const { address } = addressResult.data;

    logger.info('Coverage request received', {
      address,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const result = await txService.getAddressCoverage(address);

    const response: GetCoverageResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  }
);

/**
 * Get stored transaction count
 * GET /api/v1/eth/address/:address/count
 */
export const getStoredTransactionCount = catchAsync(
  async (req: Request, res: Response) => {
    const addressResult = AddressParamsSchema.safeParse(req.params);
    if (!addressResult.success) {
      throw ApiError.badRequest(
        'Invalid address parameters',
        z.flattenError(addressResult.error)
      );
    }
    const { address } = addressResult.data;

    logger.info('Transaction count request received', {
      address,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const count = await txService.getStoredTransactionCount(address);

    res.json({
      count,
    });
  }
);

export const getQueueInfo = catchAsync(async (req: Request, res: Response) => {
  res.json({
    data: await getQueueStats(),
  });
});
