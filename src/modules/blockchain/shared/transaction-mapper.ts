/**
 * ---------------------------------
 * Transaction Mapping Utilities
 * ---------------------------------
 * Maps transactions between different formats (ethers.js, Etherscan API, DB, API response)
 */

import { ethers } from 'ethers';

/**
 * Maps an ethers.js transaction to database format
 * @param tx - Ethers transaction object
 * @param address - Address being queried (for indexing)
 * @returns Transaction in database format
 */
export function mapEthersTransactionToDB(tx: any, address: string) {
  return {
    hash: tx.hash,
    address: address.toLowerCase(),
    blockNumber: BigInt(tx.blockNumber?.toString() || '0'),
    from: tx.from?.toLowerCase() || '',
    to: tx.to?.toLowerCase() || null,
    value: tx.value?.toString() || '0',
    gasPrice: tx.gasPrice?.toString() || '0',
    gasUsed: tx.gasLimit ? BigInt(tx.gasLimit.toString()) : null, // Note: gasLimit from pending tx
    gas: tx.gasLimit ? BigInt(tx.gasLimit.toString()) : null,
    functionName: tx.data && tx.data !== '0x' ? tx.data.slice(0, 10) : null, // First 4 bytes of data
    txreceiptStatus: '1', // Assume success for ethers transactions
    contractAddress: null, // Not available in basic ethers tx
    timestamp: new Date(), // Will be updated when we get block info
  };
}

/**
 * Maps an Etherscan API transaction to database format
 * @param tx - Etherscan transaction object
 * @param address - Address being queried (for indexing)
 * @returns Transaction in database format
 */
export function mapEtherscanTransactionToDB(tx: any, address: string) {
  return {
    hash: tx.hash,
    address: address.toLowerCase(),
    blockNumber: BigInt(tx.blockNumber),
    from: tx.from.toLowerCase(),
    to: tx.to?.toLowerCase() || null,
    value: tx.value,
    gasPrice: tx.gasPrice,
    gasUsed: tx.gasUsed ? BigInt(tx.gasUsed) : null,
    gas: tx.gas ? BigInt(tx.gas) : null,
    functionName:
      tx.functionName ||
      (tx.input && tx.input !== '0x' ? tx.input.slice(0, 10) : null),
    txreceiptStatus: tx.txreceipt_status || tx.isError === '0' ? '1' : '0', // 1 = success, 0 = failed
    contractAddress: tx.contractAddress?.toLowerCase() || null,
    timestamp: new Date(parseInt(tx.timeStamp) * 1000), // Convert Unix timestamp to Date
  };
}

/**
 * Maps an Etherscan API transaction to API response format
 * @param tx - Etherscan transaction object
 * @param address - Address being queried (for indexing)
 * @returns Transaction in database format
 */
export function mapEtherscanTransactionToAPI(tx: any, address: string) {
  return {
    hash: tx.hash,
    address: address.toLowerCase(),
    blockNumber: tx.blockNumber,
    from: tx.from?.toLowerCase() || null,
    to: tx.to?.toLowerCase() || null,
    value: tx.value,
    gasPrice: tx.gasPrice,
    gasUsed: tx.gasUsed,
    gas: tx.gas,
    functionName:
      tx.functionName ||
      (tx.input && tx.input !== '0x' ? tx.input.slice(0, 10) : null),
    txReceiptStatus: tx.txreceipt_status || tx.isError === '0' ? '1' : '0', // 1 = success, 0 = failed
    contractAddress: tx.contractAddress?.toLowerCase() || null,
    timestamp: tx.timeStamp, // Convert Unix timestamp to Date
  };
}

/**
 * Maps a database transaction to API response format
 * @param dbTx - Database transaction object
 * @returns Transaction in API response format
 */
export function mapDBTransactionToAPI(dbTx: any) {
  return {
    hash: dbTx.hash,
    blockNumber: dbTx.blockNumber.toString(), // Convert BigInt to string for JSON
    from: dbTx.from,
    to: dbTx.to,
    value: dbTx.value.toString(),
    gasPrice: dbTx.gasPrice.toString(),
    gasUsed: dbTx.gasUsed?.toString() || null,
    gas: dbTx.gas?.toString() || null,
    functionName: dbTx.functionName,
    status: dbTx.txreceiptStatus,
    contractAddress: dbTx.contractAddress,
    timestamp: dbTx.timestamp.toISOString(),
  };
}
