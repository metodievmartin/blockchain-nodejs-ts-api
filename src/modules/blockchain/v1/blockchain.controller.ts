/**
 * Blockchain Controller
 * ---------------------------------
 * HTTP request handlers for blockchain endpoints
 */
import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catch-async';
import * as blockchainService from './blockchain.service';
import {
  GetTransactionsQuerySchema,
  AddressParamsSchema,
  GetTransactionsResponse,
  BalanceResponse,
  GetCoverageResponse,
} from './blockchain.dto';
import { ApiError } from '../../../utils/api.error';
import logger from '../../../config/logger';

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

    const result = await blockchainService.getTransactions(
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
  // Validate path parameters
  const { address } = AddressParamsSchema.parse(req.params);

  logger.info('Balance request received', {
    address,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const result = await blockchainService.getBalance(address);

  const response: BalanceResponse = {
    success: true,
    data: result,
  };

  res.json(response);
});

/**
 * Get coverage information for an address
 * GET /api/v1/blockchain/address/:address/coverage
 */
export const getCoverage = catchAsync(async (req: Request, res: Response) => {
  // Validate path parameters
  const { address } = AddressParamsSchema.parse(req.params);

  logger.info('Coverage request received', {
    address,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const result = await blockchainService.getAddressCoverage(address);

  const response: GetCoverageResponse = {
    success: true,
    data: result,
  };

  res.json(response);
});

/**
 * Get transaction count for an address
 * GET /api/v1/blockchain/address/:address/count
 */
export const getTransactionCount = catchAsync(
  async (req: Request, res: Response) => {
    // Validate path parameters
    const { address } = AddressParamsSchema.parse(req.params);

    logger.info('Transaction count request received', {
      address,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const count = await blockchainService.getStoredTransactionCount(address);

    res.json({
      success: true,
      data: {
        address,
        count,
      },
    });
  }
);
