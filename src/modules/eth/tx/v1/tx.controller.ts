/**
 * Blockchain Controller
 * ---------------------------------
 * HTTP request handlers for blockchain endpoints
 */
import { Request, Response } from 'express';
import { catchAsync } from '../../../../utils/catch-async';
import * as txService from './tx.service';
import {
  AddressParamsSchema,
  GetTransactionsQuerySchema,
  GetTransactionsResponse,
  BalanceResponse,
  GetCoverageResponse,
} from './tx.dto';
import logger from '../../../../config/logger';

/**
 * Get transactions for an address
 * GET /api/v1/eth/address/:address/transactions?from=123&to=456&page=1&limit=1000&order=asc
 */
export const getTransactions = catchAsync(
  async (req: Request, res: Response) => {
    // Validate path parameters
    const { address } = AddressParamsSchema.parse(req.params);

    // Validate query parameters
    const query = GetTransactionsQuerySchema.parse(req.query);

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
  const { address } = AddressParamsSchema.parse(req.params);

  logger.info('Balance request received', {
    address,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const result = await txService.getBalance(address);

  const response: BalanceResponse = {
    success: true,
    data: result,
  };

  res.json(response);
});

/**
 * Get address coverage
 * GET /api/v1/eth/address/:address/coverage
 */
export const getAddressCoverage = catchAsync(
  async (req: Request, res: Response) => {
    const { address } = AddressParamsSchema.parse(req.params);

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
    const { address } = AddressParamsSchema.parse(req.params);

    logger.info('Transaction count request received', {
      address,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const count = await txService.getStoredTransactionCount(address);

    res.json({
      success: true,
      data: { count },
    });
  }
);
