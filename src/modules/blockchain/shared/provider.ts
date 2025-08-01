/**
 * ---------------------------------
 * Blockchain Provider Configuration
 * ---------------------------------
 * Singleton Ethereum provider for blockchain interactions
 */
import { ethers, EtherscanProvider } from 'ethers';

import logger from '../../../config/logger';
import appConfig from '../../../config/app.config';

let provider: ethers.JsonRpcProvider | null = null;
let etherscanProvider: EtherscanProvider | null = null;

/**
 * Get or create Ethereum provider singleton
 * @returns Ethereum provider instance
 */
export function getEthereumProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(appConfig.blockchain.rpcUrl, {
      name: 'sepolia',
      chainId: 11155111,
    });

    // Configure timeouts and polling
    provider.pollingInterval = 4000; // 4 seconds

    logger.info('Ethereum provider initialized', {
      network: 'sepolia',
      rpcUrl: appConfig.blockchain.rpcUrl.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
    });
  }

  return provider;
}

/**
 * Get or create Etherscan provider singleton for efficient transaction fetching
 * @returns Etherscan provider instance
 */
export function getEtherscanProvider(): EtherscanProvider {
  if (!etherscanProvider) {
    etherscanProvider = new EtherscanProvider(
      {
        name: 'sepolia',
        chainId: 11155111,
      },
      appConfig.blockchain.etherscanApiKey
    );

    logger.info('Etherscan provider initialized', {
      network: 'sepolia',
    });
  }

  return etherscanProvider;
}

/**
 * Get block number when address was created
 * @param address - Ethereum address
 * @returns Block number when address was created
 */
export async function getAddressCreationBlock(
  address: string
): Promise<number> {
  try {
    const provider = getEthereumProvider();
    const code = await provider.getCode(address);

    // If it's an EOA (no code), start from block 0
    if (code === '0x') {
      return 0;
    }

    // For contracts, we could implement binary search to find creation block
    // For now, return 0 as a simple implementation
    // TODO: Implement binary search for contract creation block detection
    logger.info('Contract detected, using block 0 as start', { address });
    return 0;
  } catch (error) {
    logger.error('Error getting address creation block', { address, error });
    return 0; // Fallback to block 0
  }
}

/**
 * Test the provider connection
 * @returns Promise that resolves if connection is successful
 */
export async function testProviderConnection(): Promise<boolean> {
  try {
    const provider = getEthereumProvider();
    const blockNumber = await provider.getBlockNumber();
    logger.info('Provider connection test successful', { blockNumber });
    return true;
  } catch (error) {
    logger.error('Provider connection test failed', { error });
    return false;
  }
}
