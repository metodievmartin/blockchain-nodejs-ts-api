/**
 * ---------------------------------
 * Ethereum Provider Configuration
 * ---------------------------------
 * Singleton providers for Ethereum JSON-RPC and Etherscan API interactions
 */

import logger from './logger';
import { ethers } from 'ethers';
import appConfig from './app.config';

let provider: ethers.JsonRpcProvider | null = null;
let etherscanProvider: ethers.EtherscanProvider | null = null;

// Extract chain-specific configuration
const sepoliaChain = appConfig.eth.chains.sepolia;
const sepoliaRpcUrl = sepoliaChain.rpcUrl;
const sepoliaNetworkConfig = {
  name: sepoliaChain.name,
  chainId: sepoliaChain.chainId,
};

/**
 * Get or create Ethereum provider singleton
 * @returns Ethereum provider instance
 */
export function getEthereumProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(sepoliaRpcUrl, sepoliaNetworkConfig);

    // Configure timeouts and polling
    provider.pollingInterval = 4000; // 4 seconds

    logger.info('Ethereum provider initialized', {
      network: sepoliaNetworkConfig.name,
      chainId: sepoliaNetworkConfig.chainId,
    });
  }

  return provider;
}

/**
 * Get or create Etherscan provider singleton for efficient transaction fetching
 * @returns Etherscan provider instance
 */
export function getEtherscanProvider(): ethers.EtherscanProvider {
  if (!etherscanProvider) {
    etherscanProvider = new ethers.EtherscanProvider(
      sepoliaNetworkConfig,
      appConfig.eth.etherscanApiKey
    );

    logger.info('Etherscan provider initialized', {
      network: sepoliaNetworkConfig.name,
      chainId: sepoliaNetworkConfig.chainId,
    });
  }

  return etherscanProvider;
}

/**
 * Test the provider connection
 * @returns Promise that resolves if connection is successful
 */
export async function testProviderConnection(): Promise<boolean> {
  try {
    const provider = getEthereumProvider();
    await provider.getBlockNumber();
    logger.info('Provider connection test successful');
    return true;
  } catch (error) {
    logger.error('Provider connection test failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
