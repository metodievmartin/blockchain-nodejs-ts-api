/**
 * Address Info Repository
 * ---------------------------------
 * Database operations for address info persistence
 */
import logger from '../../../config/logger';
import { getOrCreateDB } from '../../../config/db';
import { type AddressInfo } from './contract-detector';

const prisma = getOrCreateDB();

/**
 * Get address info from database
 * @param address - Ethereum address (checksummed)
 * @returns AddressInfo or null if not found
 */
export async function getAddressInfoFromDB(
  address: string
): Promise<AddressInfo | null> {
  try {
    const result = await prisma.addressInfo.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!result) {
      return null;
    }

    return {
      isContract: result.isContract,
      creationBlock: result.creationBlock
        ? Number(result.creationBlock)
        : undefined,
    };
  } catch (error) {
    logger.error('Error getting address info from DB', {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Save address info to database
 * @param address - Ethereum address (checksummed)
 * @param addressInfo - Address info to save
 */
export async function saveAddressInfoToDB(
  address: string,
  addressInfo: AddressInfo
): Promise<void> {
  try {
    await prisma.addressInfo.upsert({
      where: { address: address.toLowerCase() },
      update: {
        isContract: addressInfo.isContract,
        creationBlock: addressInfo.creationBlock
          ? BigInt(addressInfo.creationBlock)
          : null,
        updatedAt: new Date(),
      },
      create: {
        address: address.toLowerCase(),
        isContract: addressInfo.isContract,
        creationBlock: addressInfo.creationBlock
          ? BigInt(addressInfo.creationBlock)
          : null,
      },
    });

    logger.debug('Address info saved to DB', { address, addressInfo });
  } catch (error) {
    logger.error('Error saving address info to DB', {
      address,
      addressInfo,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - DB persistence is not critical
  }
}
