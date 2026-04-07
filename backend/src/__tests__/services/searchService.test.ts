import searchService from '../../services/searchService';
import { ValidationError } from '../../middleware/errorHandler';

// ─── Mock ─────────────────────────────────────────────────────────────────────

const mockSearch = jest.fn();
const mockGetAvailable = jest.fn();

jest.mock('../../repositories/propertyRepository', () => ({
  __esModule: true,
  default: {
    search: (...args: any[]) => mockSearch(...args),
    getAvailableProperties: (...args: any[]) => mockGetAvailable(...args),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePaginatedResult(count = 0) {
  return {
    data: Array.from({ length: count }, (_, i) => ({ id: `prop-${i}` })),
    pagination: { page: 1, limit: 20, total: count, totalPages: 1, hasNext: false, hasPrev: false },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SearchService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('searchProperties', () => {
    it('delegates to repository with sanitised filters', async () => {
      mockSearch.mockResolvedValue(makePaginatedResult(2));

      const result = await searchService.searchProperties({
        region: 'Auckland',
        status: 'available',
        page: 1,
        limit: 10,
      });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'Auckland', status: 'available', page: 1, limit: 10 }),
        undefined // userId parameter
      );
      expect(result.data).toHaveLength(2);
    });

    it('throws ValidationError when minPrice > maxPrice', async () => {
      await expect(
        searchService.searchProperties({ minPrice: 500000, maxPrice: 100000 })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for negative minPrice', async () => {
      await expect(
        searchService.searchProperties({ minPrice: -1 })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for negative maxPrice', async () => {
      await expect(
        searchService.searchProperties({ maxPrice: -1 })
      ).rejects.toThrow(ValidationError);
    });

    it('clamps page to minimum 1', async () => {
      mockSearch.mockResolvedValue(makePaginatedResult());

      await searchService.searchProperties({ page: -5 });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }), undefined);
    });

    it('clamps limit to MAX_LIMIT', async () => {
      mockSearch.mockResolvedValue(makePaginatedResult());

      await searchService.searchProperties({ limit: 9999 });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }), // PAGINATION.MAX_LIMIT
        undefined
      );
    });

    it('passes keyword filter through', async () => {
      mockSearch.mockResolvedValue(makePaginatedResult(1));

      await searchService.searchProperties({ keyword: 'beachfront' });

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'beachfront' }),
        undefined
      );
    });

    it('returns empty result when no properties match', async () => {
      mockSearch.mockResolvedValue(makePaginatedResult(0));

      const result = await searchService.searchProperties({ region: 'Nowhere' });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getAvailableProperties', () => {
    it('delegates to repository', async () => {
      mockGetAvailable.mockResolvedValue(makePaginatedResult(3));

      const result = await searchService.getAvailableProperties(1, 20);

      expect(mockGetAvailable).toHaveBeenCalledWith(1, 20);
      expect(result.data).toHaveLength(3);
    });

    it('clamps page and limit', async () => {
      mockGetAvailable.mockResolvedValue(makePaginatedResult());

      await searchService.getAvailableProperties(-1, 9999);

      expect(mockGetAvailable).toHaveBeenCalledWith(1, 100);
    });
  });
});
