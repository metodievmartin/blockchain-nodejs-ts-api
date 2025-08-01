/**
 * Blockchain Repository
 * ---------------------------------
 * Database operations for blockchain transactions and coverage tracking
 */
import { getOrCreateDB } from '../../../../config/db';
import { mapEtherscanTransactionToDB } from '../../shared/transaction-mapper';
import logger from '../../../../config/logger';

const prisma = getOrCreateDB();

/**
 * Find gaps in coverage for a given address and block range
 * @param address - Ethereum address (normalized)
 * @param requestedFrom - Starting block number
 * @param requestedTo - Ending block number
 * @returns Array of gaps that need to be filled
 */
export async function findGaps(
  address: string, 
  requestedFrom: number, 
  requestedTo: number
): Promise<Gap[]> {
  try {
    // Get all coverage ranges that overlap with requested range
    const coverageRanges = await prisma.coverage.findMany({
      where: {
        address: address.toLowerCase(),
        toBlock: { gte: requestedFrom },
        fromBlock: { lte: requestedTo }
      },
      orderBy: { fromBlock: 'asc' },
      select: { fromBlock: true, toBlock: true }
    });

    logger.debug('Found coverage ranges', {
      address,
      requestedFrom,
      requestedTo,
      coverageCount: coverageRanges.length
    });

    const gaps: Gap[] = [];
    let cursor = requestedFrom;

    for (const range of coverageRanges) {
      // If there's a gap before this range
      if (cursor < range.fromBlock) {
        gaps.push({
          fromBlock: cursor,
          toBlock: range.fromBlock - 1
        });
      }
      
      // Move cursor past this range
      cursor = Math.max(cursor, range.toBlock + 1);
    }

    // If there's a gap after all ranges
    if (cursor <= requestedTo) {
      gaps.push({
        fromBlock: cursor,
        toBlock: requestedTo
      });
    }

    logger.debug('Calculated gaps', {
      address,
      requestedFrom,
      requestedTo,
      gaps: gaps.length,
      totalMissingBlocks: gaps.reduce((sum, gap) => sum + (gap.toBlock - gap.fromBlock + 1), 0)
    });

    return gaps;
  } catch (error) {
    logger.error('Error finding gaps', {
      address,
      requestedFrom,
      requestedTo,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get existing transactions for an address within a block range
 * @param address - Ethereum address (normalized)
 * @param fromBlock - Starting block number (optional)
 * @param toBlock - Ending block number (optional)
 * @returns Array of transactions
 */
export async function getExistingTransactions(
  address: string,
  fromBlock?: number,
  toBlock?: number
) {
  try {
    const where: any = {
      address: address.toLowerCase()
    };

    if (fromBlock !== undefined || toBlock !== undefined) {
      where.blockNumber = {};
      if (fromBlock !== undefined) where.blockNumber.gte = fromBlock;
      if (toBlock !== undefined) where.blockNumber.lte = toBlock;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { blockNumber: 'asc' }
    });

    logger.debug('Retrieved existing transactions', {
      address,
      fromBlock,
      toBlock,
      count: transactions.length
    });

    return transactions;
  } catch (error) {
    logger.error('Error getting existing transactions', {
      address,
      fromBlock,
      toBlock,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get existing transactions for an address within a block range with pagination
 * @param address - Ethereum address
 * @param fromBlock - Starting block number
 * @param toBlock - Ending block number
 * @param page - Page number (1-based)
 * @param limit - Number of results per page
 * @param order - Sort order ('asc' or 'desc')
 * @returns Array of transactions
 */
export async function getExistingTransactionsPaginated(
  address: string,
  fromBlock: number,
  toBlock: number,
  page: number,
  limit: number,
  order: 'asc' | 'desc'
): Promise<any[]> {
  const db = getOrCreateDB();
  const skip = (page - 1) * limit;
  
  try {
    const transactions = await db.transaction.findMany({
      where: {
        address: address.toLowerCase(),
        blockNumber: {
          gte: fromBlock,
          lte: toBlock,
        },
      },
      orderBy: {
        blockNumber: order,
      },
      skip,
      take: limit,
    });

    logger.debug('Retrieved paginated transactions from database', {
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order,
      found: transactions.length,
    });

    return transactions;
  } catch (error) {
    logger.error('Error retrieving paginated transactions', {
      address,
      fromBlock,
      toBlock,
      page,
      limit,
      order,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Save a batch of transactions and coverage in a database transaction
 * @param address - Ethereum address
 * @param fromBlock - Starting block number
 * @param toBlock - Ending block number  
 * @param transactions - Array of transactions to save
 */
export async function saveTransactionBatch(
  address: string,
  fromBlock: number,
  toBlock: number,
  transactions: any[]
): Promise<void> {
  const db = getOrCreateDB();
  
  try {
    await db.$transaction(async (prisma) => {
      // Save transactions if any
      if (transactions.length > 0) {
        await prisma.transaction.createMany({
          data: transactions,
          skipDuplicates: true, // Skip if transaction already exists
        });
        
        logger.debug('Saved transaction batch', {
          address,
          fromBlock,
          toBlock,
          count: transactions.length,
        });
      }
      
      // Save or update coverage
      await prisma.coverage.upsert({
        where: {
          uniq_coverage: {
            address,
            fromBlock,
            toBlock,
          },
        },
        update: {
          // Coverage already exists, no need to update anything
        },
        create: {
          address,
          fromBlock,
          toBlock,
        },
      });
      
      logger.debug('Saved coverage range', {
        address,
        fromBlock,
        toBlock,
      });
    });
    
    logger.info('Transaction batch saved successfully', {
      address,
      fromBlock,
      toBlock,
      transactionCount: transactions.length,
    });
  } catch (error) {
    logger.error('Failed to save transaction batch', {
      address,
      fromBlock,
      toBlock,
      transactionCount: transactions.length,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get transaction count for an address
 * @param address - Ethereum address (normalized)
 * @returns Number of transactions
 */
export async function getTransactionCount(address: string): Promise<number> {
  try {
    const count = await prisma.transaction.count({
      where: {
        address: address.toLowerCase()
      }
    });

    logger.debug('Retrieved transaction count', { address, count });
    return count;
  } catch (error) {
    logger.error('Error getting transaction count', {
      address,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get coverage information for an address
 * @param address - Ethereum address (normalized)
 * @returns Array of coverage ranges
 */
export async function getCoverageRanges(address: string) {
  try {
    const coverage = await prisma.coverage.findMany({
      where: {
        address: address.toLowerCase()
      },
      orderBy: { fromBlock: 'asc' },
      select: {
        fromBlock: true,
        toBlock: true,
        createdAt: true
      }
    });

    logger.debug('Retrieved coverage ranges', {
      address,
      rangeCount: coverage.length
    });

    return coverage;
  } catch (error) {
    logger.error('Error getting coverage ranges', {
      address,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Delete all data for an address (for testing/cleanup)
 * @param address - Ethereum address (normalized)
 */
export async function deleteAddressData(address: string): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { address: address.toLowerCase() }
      });
      
      await tx.coverage.deleteMany({
        where: { address: address.toLowerCase() }
      });
    });

    logger.info('Address data deleted', { address });
  } catch (error) {
    logger.error('Error deleting address data', {
      address,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export interface Gap {
  fromBlock: number;
  toBlock: number;
}
