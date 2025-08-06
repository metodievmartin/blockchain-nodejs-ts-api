/**
 * Contract Detection Utilities
 * ---------------------------------
 * Pure utility functions for detecting contracts and finding their creation blocks
 */
import { ethers } from 'ethers';

import logger from '../../../config/logger';
import { getEthereumProvider } from '../../../config/providers';

/**
 * Address info interface
 */
export interface AddressInfo {
  isContract: boolean;
  creationBlock?: number;
}

/**
 * Discovers if an address is a contract and finds its creation block
 * Pure function without caching - caching should be handled by the caller
 * @param address - The address to check (must be checksummed)
 * @returns Object with isContract flag and creationBlock (if contract)
 */
export async function discoverAddressInfo(address: string): Promise<AddressInfo> {
  const provider = getEthereumProvider();
  
  try {
    // Check if address has code at latest block
    const code = await provider.getCode(address);
    const isContract = code !== '0x';
    
    if (!isContract) {
      logger.debug('Address is EOA', { address });
      return { isContract: false };
    }
    
    // For contracts, find the creation block using binary search
    const creationBlock = await findContractCreationBlock(address, provider);
    
    logger.debug('Address is contract', { 
      address, 
      creationBlock 
    });
    
    return { 
      isContract: true, 
      creationBlock 
    };
    
  } catch (error) {
    logger.error('Error detecting contract info', {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Default to EOA behavior on error
    return { isContract: false };
  }
}

/**
 * Finds the contract creation block using binary search
 * @param address - Contract address
 * @param provider - Ethereum provider
 * @returns Block number where contract was created
 */
export async function findContractCreationBlock(
  address: string, 
  provider: ethers.Provider
): Promise<number> {
  // Get current block number
  const latestBlock = await provider.getBlockNumber();
  
  // Binary search for the creation block
  let low = 0;
  let high = latestBlock;
  let creationBlock = 0;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    
    try {
      const code = await provider.getCode(address, mid);
      
      if (code === '0x') {
        // No code at this block, contract created later
        low = mid + 1;
      } else {
        // Code exists at this block, contract created at or before this block
        creationBlock = mid;
        high = mid - 1;
      }
    } catch (error) {
      // If we can't get code at this block, try a more recent block
      low = mid + 1;
    }
  }
  
  return creationBlock;
}
