/**
 * Ethereum Address Validation Utilities
 * ---------------------------------
 * Utilities for validating and normalizing Ethereum addresses
 */
import { ethers } from 'ethers';
import { ApiError } from '../../../utils/api.error';

/**
 * Validates and normalizes an Ethereum address
 * @param address - Raw address string to validate
 * @returns Normalized (checksummed) address
 * @throws ApiError if address is invalid
 */
export function validateAndNormalizeAddress(address: string): string {
  try {
    // ethers.getAddress() validates and returns checksummed address
    return ethers.getAddress(address.toLowerCase());
  } catch (error) {
    throw new ApiError(400, 'INVALID_ADDRESS', 'Invalid Ethereum address format');
  }
}

/**
 * Checks if a string is a valid Ethereum address format
 * @param address - Address string to check
 * @returns True if valid format, false otherwise
 */
export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates block number parameters
 * @param fromBlock - Starting block number
 * @param toBlock - Ending block number
 * @throws ApiError if block numbers are invalid
 */
export function validateBlockRange(fromBlock?: number, toBlock?: number): void {
  if (fromBlock !== undefined && fromBlock < 0) {
    throw new ApiError(400, 'INVALID_FROM_BLOCK', 'fromBlock must be non-negative');
  }
  
  if (toBlock !== undefined && toBlock < 0) {
    throw new ApiError(400, 'INVALID_TO_BLOCK', 'toBlock must be non-negative');
  }
  
  if (fromBlock !== undefined && toBlock !== undefined && fromBlock > toBlock) {
    throw new ApiError(400, 'INVALID_BLOCK_RANGE', 'fromBlock cannot be greater than toBlock');
  }
}
