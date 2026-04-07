import request from 'supertest';
import app from '../../server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/searchService', () => ({
  __esModule: true,
  default: {
    searchProperties: jest.fn(),
    getAvailableProperties: jest.fn(),
  },
}));

jest.mock('../../services/regionService', () => ({
  __esModule: true,
  default: {
    getRegions: jest.fn(),
  },
}));

import searchService from '../../services/searchService';
import regionService from '../../services/regionService';

const mockSearchService = searchService as jest.Mocked<typeof searchService>;
const mockRegionService = regionService as jest.Mocked<typeof regionService>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePaginatedResult(count = 2) {
  return {
    data: Array.from({ length: count }, (_, i) => ({
      id: `prop-${i}`,
      title: `Property ${i}`,
      price: 100000 * (i + 1),
      status: 'available',
    })),
    pagination: {
      page: 1,
      limit: 20,
      total: count,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Search Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── GET /api/v1/search/properties ────────────────────────────────────────────

  describe('GET /api/v1/search/properties', () => {
    it('returns paginated search results', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(2) as any);

      const res = await request(app).get('/api/v1/search/properties');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(2);
      expect(mockSearchService.searchProperties).toHaveBeenCalled();
    });

    it('passes region filter to service', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(1) as any);

      await request(app).get('/api/v1/search/properties?region=Auckland');

      expect(mockSearchService.searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'Auckland' }),
        undefined // userId when not authenticated
      );
    });

    it('passes price range filters to service', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(0) as any);

      await request(app).get('/api/v1/search/properties?minPrice=100000&maxPrice=500000');

      expect(mockSearchService.searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 100000, maxPrice: 500000 }),
        undefined
      );
    });

    it('passes keyword filter to service', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(1) as any);

      await request(app).get('/api/v1/search/properties?keyword=beachfront');

      expect(mockSearchService.searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'beachfront' }),
        undefined
      );
    });

    it('passes propertyType filter to service', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(1) as any);

      await request(app).get('/api/v1/search/properties?propertyType=house');

      expect(mockSearchService.searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ propertyType: 'house' }),
        undefined
      );
    });

    it('passes pagination params to service', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(0) as any);

      await request(app).get('/api/v1/search/properties?page=2&limit=5');

      expect(mockSearchService.searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 5 }),
        undefined
      );
    });

    it('passes sortBy and sortOrder to service', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(0) as any);

      await request(app).get('/api/v1/search/properties?sortBy=price&sortOrder=asc');

      expect(mockSearchService.searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'price', sortOrder: 'asc' }),
        undefined
      );
    });

    it('returns 400 when service throws ValidationError', async () => {
      const { ValidationError } = require('../../middleware/errorHandler');
      mockSearchService.searchProperties.mockRejectedValue(
        new ValidationError('minPrice cannot be greater than maxPrice')
      );

      const res = await request(app).get('/api/v1/search/properties?minPrice=500000&maxPrice=100000');

      expect(res.status).toBe(400);
    });

    it('returns empty results when no properties match', async () => {
      mockSearchService.searchProperties.mockResolvedValue(makePaginatedResult(0) as any);

      const res = await request(app).get('/api/v1/search/properties?region=Nowhere');

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  // ── GET /api/v1/search/regions ───────────────────────────────────────────────

  describe('GET /api/v1/search/regions', () => {
    const mockRegions = [
      { id: 'north', name: 'north', displayName: 'North Region', active: true },
      { id: 'south', name: 'south', displayName: 'South Region', active: true },
    ];

    it('returns list of active regions', async () => {
      mockRegionService.getRegions.mockResolvedValue(mockRegions as any);

      const res = await request(app).get('/api/v1/search/regions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('north');
    });

    it('returns empty array when no regions exist', async () => {
      mockRegionService.getRegions.mockResolvedValue([]);

      const res = await request(app).get('/api/v1/search/regions');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
});
