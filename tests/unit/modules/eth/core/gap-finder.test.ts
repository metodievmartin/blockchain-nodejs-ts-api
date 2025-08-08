import { findGapsInCoverage } from '../../../../../src/modules/eth/core/gap-finder';

// Mock the logger to avoid any external dependencies
jest.mock('../../../../../src/config/logger', () => ({
  debug: jest.fn(),
}));

describe('findGapsInCoverage', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';

  describe('when coverage ranges are empty', () => {
    it('should return the entire requested range as a gap', () => {
      const coverageRanges: Array<{ fromBlock: number; toBlock: number }> = [];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([
        { fromBlock: 100, toBlock: 200 }
      ]);
    });
  });

  describe('when coverage ranges fully cover the requested range', () => {
    it('should return no gaps for exact coverage', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 200 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([]);
    });

    it('should return no gaps when coverage exceeds requested range', () => {
      const coverageRanges = [
        { fromBlock: 50, toBlock: 250 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([]);
    });

    it('should return no gaps with multiple overlapping ranges', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 150 },
        { fromBlock: 140, toBlock: 200 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([]);
    });
  });

  describe('when there are gaps before coverage ranges', () => {
    it('should find gap at the beginning', () => {
      const coverageRanges = [
        { fromBlock: 150, toBlock: 200 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([
        { fromBlock: 100, toBlock: 149 }
      ]);
    });

    it('should find gap at the beginning with multiple ranges', () => {
      const coverageRanges = [
        { fromBlock: 150, toBlock: 160 },
        { fromBlock: 170, toBlock: 200 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([
        { fromBlock: 100, toBlock: 149 },
        { fromBlock: 161, toBlock: 169 }
      ]);
    });
  });

  describe('when there are gaps after coverage ranges', () => {
    it('should find gap at the end', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 150 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([
        { fromBlock: 151, toBlock: 200 }
      ]);
    });
  });

  describe('when there are gaps between coverage ranges', () => {
    it('should find single gap between two ranges', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 120 },
        { fromBlock: 130, toBlock: 150 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 150, mockAddress);

      expect(result).toEqual([
        { fromBlock: 121, toBlock: 129 }
      ]);
    });

    it('should find multiple gaps between ranges', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 110 },
        { fromBlock: 120, toBlock: 130 },
        { fromBlock: 140, toBlock: 150 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 150, mockAddress);

      expect(result).toEqual([
        { fromBlock: 111, toBlock: 119 },
        { fromBlock: 131, toBlock: 139 }
      ]);
    });
  });

  describe('when there are complex gap scenarios', () => {
    it('should handle gaps at beginning, middle, and end', () => {
      const coverageRanges = [
        { fromBlock: 120, toBlock: 130 },
        { fromBlock: 140, toBlock: 150 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([
        { fromBlock: 100, toBlock: 119 },
        { fromBlock: 131, toBlock: 139 },
        { fromBlock: 151, toBlock: 200 }
      ]);
    });

    it('should handle adjacent ranges (no gaps between)', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 120 },
        { fromBlock: 121, toBlock: 140 },
        { fromBlock: 141, toBlock: 160 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 160, mockAddress);

      expect(result).toEqual([]);
    });

    it('should handle single block gaps', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 100 },
        { fromBlock: 102, toBlock: 102 },
        { fromBlock: 104, toBlock: 104 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 104, mockAddress);

      expect(result).toEqual([
        { fromBlock: 101, toBlock: 101 },
        { fromBlock: 103, toBlock: 103 }
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle when fromBlock equals toBlock', () => {
      const coverageRanges = [
        { fromBlock: 150, toBlock: 150 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([
        { fromBlock: 100, toBlock: 149 },
        { fromBlock: 151, toBlock: 200 }
      ]);
    });

    it('should handle coverage that starts before requested range', () => {
      const coverageRanges = [
        { fromBlock: 50, toBlock: 120 },
        { fromBlock: 150, toBlock: 180 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 200, mockAddress);

      expect(result).toEqual([
        { fromBlock: 121, toBlock: 149 },
        { fromBlock: 181, toBlock: 200 }
      ]);
    });

    it('should handle block 0 scenarios', () => {
      const coverageRanges = [
        { fromBlock: 10, toBlock: 20 }
      ];
      const result = findGapsInCoverage(coverageRanges, 0, 30, mockAddress);

      expect(result).toEqual([
        { fromBlock: 0, toBlock: 9 },
        { fromBlock: 21, toBlock: 30 }
      ]);
    });

    it('should handle very large block numbers', () => {
      const coverageRanges = [
        { fromBlock: 1000000, toBlock: 1000010 }
      ];
      const result = findGapsInCoverage(coverageRanges, 999990, 1000020, mockAddress);

      expect(result).toEqual([
        { fromBlock: 999990, toBlock: 999999 },
        { fromBlock: 1000011, toBlock: 1000020 }
      ]);
    });
  });

  describe('return type validation', () => {
    it('should return an array of objects with fromBlock and toBlock properties', () => {
      const coverageRanges = [
        { fromBlock: 100, toBlock: 120 }
      ];
      const result = findGapsInCoverage(coverageRanges, 100, 150, mockAddress);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('fromBlock');
      expect(result[0]).toHaveProperty('toBlock');
      expect(typeof result[0].fromBlock).toBe('number');
      expect(typeof result[0].toBlock).toBe('number');
    });
  });
});
