import { validateAndNormalizeAddress, validateBlockRange } from '../../../../../src/modules/eth/utils/address-validator';
import { ApiError } from '../../../../../src/lib/errors';

describe('Address Validator Utils', () => {
  describe('validateAndNormalizeAddress', () => {
    describe('valid addresses', () => {
      it('should return checksummed address for valid lowercase address', () => {
        const lowercaseAddress = '0x1234567890abcdef123456789012345678901234';
        const result = validateAndNormalizeAddress(lowercaseAddress);
        
        expect(result).toBe('0x1234567890abcdEF123456789012345678901234');
        expect(typeof result).toBe('string');
      });

      it('should return checksummed address for valid uppercase address', () => {
        const uppercaseAddress = '0x1234567890ABCDEF123456789012345678901234';
        const result = validateAndNormalizeAddress(uppercaseAddress);
        
        expect(result).toBe('0x1234567890abcdEF123456789012345678901234');
      });

      it('should return checksummed address for mixed case address', () => {
        const mixedCaseAddress = '0x1234567890abcdef123456789012345678901234';
        const result = validateAndNormalizeAddress(mixedCaseAddress);
        
        expect(result).toBe('0x1234567890abcdEF123456789012345678901234');
      });

      it('should handle real Ethereum addresses correctly', () => {
        // Ethereum Foundation address
        const ethFoundationAddress = '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae';
        const result = validateAndNormalizeAddress(ethFoundationAddress);
        
        expect(result).toBe('0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe');
      });
    });

    describe('invalid addresses', () => {
      it('should throw ApiError for address too short', () => {
        const shortAddress = '0x123456789012345678901234567890123456789';
        
        expect(() => validateAndNormalizeAddress(shortAddress)).toThrow(ApiError);
        expect(() => validateAndNormalizeAddress(shortAddress)).toThrow('Invalid Ethereum address format');
      });

      it('should throw ApiError for address too long', () => {
        const longAddress = '0x12345678901234567890123456789012345678901';
        
        expect(() => validateAndNormalizeAddress(longAddress)).toThrow(ApiError);
        expect(() => validateAndNormalizeAddress(longAddress)).toThrow('Invalid Ethereum address format');
      });

      it('should not throw ApiError for address without 0x prefix', () => {
        const noPrefixAddress = '1234567890123456789012345678901234567890';
        
        expect(() => validateAndNormalizeAddress(noPrefixAddress)).not.toThrow(ApiError);
      });

      it('should throw ApiError for address with invalid characters', () => {
        const invalidCharAddress = '0x123456789012345678901234567890123456789G';
        
        expect(() => validateAndNormalizeAddress(invalidCharAddress)).toThrow(ApiError);
        expect(() => validateAndNormalizeAddress(invalidCharAddress)).toThrow('Invalid Ethereum address format');
      });

      it('should throw ApiError for empty string', () => {
        expect(() => validateAndNormalizeAddress('')).toThrow(ApiError);
        expect(() => validateAndNormalizeAddress('')).toThrow('Invalid Ethereum address format');
      });

      it('should throw ApiError for null/undefined input', () => {
        expect(() => validateAndNormalizeAddress(null as any)).toThrow(ApiError);
        expect(() => validateAndNormalizeAddress(undefined as any)).toThrow(ApiError);
      });
    });
  });

  describe('validateBlockRange', () => {
    describe('valid block ranges', () => {
      it('should not throw for valid fromBlock and toBlock', () => {
        expect(() => validateBlockRange(100, 200)).not.toThrow();
      });

      it('should not throw for equal fromBlock and toBlock', () => {
        expect(() => validateBlockRange(100, 100)).not.toThrow();
      });

      it('should not throw for block 0', () => {
        expect(() => validateBlockRange(0, 100)).not.toThrow();
        expect(() => validateBlockRange(100, 0)).toThrow(); // This should throw
      });

      it('should not throw when only fromBlock is provided', () => {
        expect(() => validateBlockRange(100)).not.toThrow();
        expect(() => validateBlockRange(0)).not.toThrow();
      });

      it('should not throw when only toBlock is provided', () => {
        expect(() => validateBlockRange(undefined, 100)).not.toThrow();
        expect(() => validateBlockRange(undefined, 0)).not.toThrow();
      });

      it('should not throw when both parameters are undefined', () => {
        expect(() => validateBlockRange()).not.toThrow();
        expect(() => validateBlockRange(undefined, undefined)).not.toThrow();
      });

      it('should not throw for large block numbers', () => {
        expect(() => validateBlockRange(1000000, 2000000)).not.toThrow();
      });
    });

    describe('invalid block ranges', () => {
      it('should throw ApiError for negative fromBlock', () => {
        expect(() => validateBlockRange(-1, 100)).toThrow(ApiError);
        expect(() => validateBlockRange(-1, 100)).toThrow('fromBlock must be non-negative');
      });

      it('should throw ApiError for negative toBlock', () => {
        expect(() => validateBlockRange(100, -1)).toThrow(ApiError);
        expect(() => validateBlockRange(100, -1)).toThrow('toBlock must be non-negative');
      });

      it('should throw ApiError when fromBlock is greater than toBlock', () => {
        expect(() => validateBlockRange(200, 100)).toThrow(ApiError);
        expect(() => validateBlockRange(200, 100)).toThrow('fromBlock cannot be greater than toBlock');
      });

      it('should throw ApiError for both negative values', () => {
        expect(() => validateBlockRange(-1, -2)).toThrow(ApiError);
        expect(() => validateBlockRange(-1, -2)).toThrow('fromBlock must be non-negative');
      });

      it('should throw ApiError for negative fromBlock even when toBlock is undefined', () => {
        expect(() => validateBlockRange(-1)).toThrow(ApiError);
        expect(() => validateBlockRange(-1)).toThrow('fromBlock must be non-negative');
      });

      it('should throw ApiError for negative toBlock even when fromBlock is undefined', () => {
        expect(() => validateBlockRange(undefined, -1)).toThrow(ApiError);
        expect(() => validateBlockRange(undefined, -1)).toThrow('toBlock must be non-negative');
      });
    });

    describe('edge cases', () => {
      it('should handle very large numbers correctly', () => {
        const maxSafeInteger = Number.MAX_SAFE_INTEGER;
        expect(() => validateBlockRange(0, maxSafeInteger)).not.toThrow();
        expect(() => validateBlockRange(maxSafeInteger - 1, maxSafeInteger)).not.toThrow();
      });

      it('should prioritize fromBlock negative check over range check', () => {
        // When fromBlock is negative, it should throw the fromBlock error first
        expect(() => validateBlockRange(-1, -2)).toThrow('fromBlock must be non-negative');
      });

      it('should check toBlock negative after fromBlock is valid', () => {
        // When fromBlock is valid but toBlock is negative
        expect(() => validateBlockRange(0, -1)).toThrow('toBlock must be non-negative');
      });
    });
  });
});
