/**
 * ---------------------------------
 * Transaction Mapping Utilities
 * ---------------------------------
 * Maps transactions between different formats (ethers.js, Etherscan API, DB, API response)
 */

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
    txReceiptStatus: dbTx.txreceiptStatus,
    contractAddress: dbTx.contractAddress,
    timestamp: dbTx.timestamp.toISOString(),
  };
}
