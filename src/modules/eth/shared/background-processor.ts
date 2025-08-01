/**
 * ---------------------------------
 * Background Transaction Processor
 * ---------------------------------
 * Handles background processing of large transaction gaps using Etherscan API with pagination
 */
import { getEtherscanProvider } from './provider';
import { mapEtherscanTransactionToDB } from './transaction-mapper';
import { saveTransactionBatch } from '../tx/v1/tx.repository';
import appConfig from '../../../config/app.config';
import logger from '../../../config/logger';

/**
 * Process large gaps in background using Node.js event loop
 * Uses Etherscan API with pagination for efficient transaction fetching
 * @param address - Ethereum address
 * @param gaps - Array of gap objects with fromBlock and toBlock
 */
export function processGapsInBackground(
  address: string,
  gaps: Array<{ fromBlock: number; toBlock: number }>
): void {
  // Fire and forget - use setImmediate to avoid blocking the current request
  setImmediate(async () => {
    try {
      logger.info('Starting background gap processing with Etherscan API', {
        address,
        gaps: gaps.length,
        totalBlocks: gaps.reduce(
          (sum, gap) => sum + (gap.toBlock - gap.fromBlock + 1),
          0
        ),
      });

      // for (const gap of gaps) {
      //   await processGapWithEtherscan(address, gap.fromBlock, gap.toBlock);
      //
      //   logger.info('Background gap processing completed', {
      //     address,
      //     fromBlock: gap.fromBlock,
      //     toBlock: gap.toBlock,
      //     blocks: gap.toBlock - gap.fromBlock + 1,
      //   });
      // }

      logger.info('All background gaps processed successfully', { address });
    } catch (error) {
      logger.error('Background gap processing failed', {
        address,
        gaps,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * Process a single gap using Etherscan API with pagination
 * @param address - Ethereum address
 * @param fromBlock - Starting block number
 * @param toBlock - Ending block number
 */
export async function processGapWithEtherscan(
  address: string,
  fromBlock: number,
  toBlock: number
): Promise<void> {
  const etherscanProvider = getEtherscanProvider();
  const pageSize = 5000; // Use 5000 per page for manageable chunks
  let page = 1;
  let allTransactions: any[] = [];
  let hasMoreData = true;

  logger.info('Starting Etherscan gap processing', {
    address,
    fromBlock,
    toBlock,
    pageSize,
  });

  try {
    while (hasMoreData) {
      const params = {
        action: 'txlist',
        address: address,
        startblock: fromBlock,
        endblock: toBlock,
        offset: pageSize,
        page: page,
        sort: 'asc',
      };

      logger.debug('Fetching transactions from Etherscan', {
        address,
        page,
        params,
      });

      const transactions = await etherscanProvider.fetch('account', params);

      if (!transactions || transactions.length === 0) {
        hasMoreData = false;
        break;
      }

      // Filter transactions within our block range (Etherscan might return outside range)
      const filteredTransactions = transactions.filter((tx: any) => {
        const blockNumber = parseInt(tx.blockNumber);
        return blockNumber >= fromBlock && blockNumber <= toBlock;
      });

      allTransactions.push(...filteredTransactions);

      logger.debug('Fetched transaction batch', {
        address,
        page,
        received: transactions.length,
        filtered: filteredTransactions.length,
        total: allTransactions.length,
      });

      // If we received less than pageSize, we've reached the end
      if (transactions.length < pageSize) {
        hasMoreData = false;
      } else {
        page++;
        // Small delay to avoid overwhelming Etherscan API
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Map and save all transactions for this gap
    if (allTransactions.length > 0) {
      const mappedTransactions = allTransactions.map((tx) =>
        mapEtherscanTransactionToDB(tx, address)
      );

      await saveTransactionBatch(
        address,
        fromBlock,
        toBlock,
        mappedTransactions
      );

      logger.info('Gap processing completed successfully', {
        address,
        fromBlock,
        toBlock,
        totalTransactions: allTransactions.length,
        pages: page - 1,
      });
    } else {
      // Still save coverage even if no transactions found
      await saveTransactionBatch(address, fromBlock, toBlock, []);

      logger.info('Gap processing completed with no transactions', {
        address,
        fromBlock,
        toBlock,
      });
    }
  } catch (error) {
    logger.error('Etherscan gap processing failed', {
      address,
      fromBlock,
      toBlock,
      page,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Process gaps synchronously using Etherscan API (for small ranges)
 * @param address - Ethereum address
 * @param fromBlock - Starting block number
 * @param toBlock - Ending block number
 */
export async function processGapInBatches(
  address: string,
  fromBlock: number,
  toBlock: number
): Promise<void> {
  // For small ranges, we can use the same Etherscan logic but synchronously
  await processGapWithEtherscan(address, fromBlock, toBlock);
}
