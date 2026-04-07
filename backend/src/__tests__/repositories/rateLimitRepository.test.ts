import rateLimitRepository from '../../repositories/rateLimitRepository';
import { getFirebaseFirestore } from '../../config/firebase';
import { RateLimitResourceType } from '../../types';
import { DatabaseError } from '../../middleware/errorHandler';

// Mock Firebase
jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

describe('RateLimitRepository', () => {
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockWhere: jest.Mock;
  let mockOrderBy: jest.Mock;
  let mockLimit: jest.Mock;
  let mockBatch: jest.Mock;
  let mockBatchCommit: jest.Mock;
  let mockBatchDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock functions
    mockGet = jest.fn();
    mockSet = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockWhere = jest.fn();
    mockOrderBy = jest.fn();
    mockLimit = jest.fn();
    mockBatchCommit = jest.fn();
    mockBatchDelete = jest.fn();

    // Setup mock document
    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
      delete: mockDelete,
    }));

    // Setup mock batch
    mockBatch = jest.fn(() => ({
      commit: mockBatchCommit,
      delete: mockBatchDelete,
    }));

    // Setup mock collection with chainable methods
    mockCollection = jest.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
    }));

    // Make where, orderBy, and limit chainable
    mockWhere.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
    });

    mockOrderBy.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
    });

    mockLimit.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
    });

    // Setup Firebase mock
    (getFirebaseFirestore as jest.Mock).mockReturnValue({
      collection: mockCollection,
      batch: mockBatch,
    });
  });

  describe('findByUserAndType', () => {
    it('should find rate limit entry by user ID and resource type', async () => {
      const mockData = {
        userId: 'user123',
        resourceType: 'property_creation' as RateLimitResourceType,
        count: 3,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-02T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'entry123',
            data: () => ({
              ...mockData,
              windowStart: { toDate: () => mockData.windowStart },
              windowEnd: { toDate: () => mockData.windowEnd },
              createdAt: { toDate: () => mockData.createdAt },
              updatedAt: { toDate: () => mockData.updatedAt },
            }),
          },
        ],
      });

      const result = await rateLimitRepository.findByUserAndType(
        'user123',
        'property_creation'
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('entry123');
      expect(result?.userId).toBe('user123');
      expect(result?.resourceType).toBe('property_creation');
      expect(result?.count).toBe(3);
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(mockWhere).toHaveBeenCalledWith('resourceType', '==', 'property_creation');
    });

    it('should find rate limit entry with resourceId for appointment requests', async () => {
      const mockData = {
        userId: 'user123',
        resourceType: 'appointment_request' as RateLimitResourceType,
        resourceId: 'property456',
        count: 2,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-02T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'entry456',
            data: () => ({
              ...mockData,
              windowStart: { toDate: () => mockData.windowStart },
              windowEnd: { toDate: () => mockData.windowEnd },
              createdAt: { toDate: () => mockData.createdAt },
              updatedAt: { toDate: () => mockData.updatedAt },
            }),
          },
        ],
      });

      const result = await rateLimitRepository.findByUserAndType(
        'user123',
        'appointment_request',
        'property456'
      );

      expect(result).toBeDefined();
      expect(result?.resourceId).toBe('property456');
      expect(mockWhere).toHaveBeenCalledWith('resourceId', '==', 'property456');
    });

    it('should return null when no entry is found', async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await rateLimitRepository.findByUserAndType(
        'user123',
        'property_creation'
      );

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on failure', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      await expect(
        rateLimitRepository.findByUserAndType('user123', 'property_creation')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('findByIP', () => {
    it('should find rate limit entry by IP address', async () => {
      const mockData = {
        ipAddress: '192.168.1.1',
        resourceType: 'registration' as RateLimitResourceType,
        count: 4,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-01T01:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'entry789',
            data: () => ({
              ...mockData,
              windowStart: { toDate: () => mockData.windowStart },
              windowEnd: { toDate: () => mockData.windowEnd },
              createdAt: { toDate: () => mockData.createdAt },
              updatedAt: { toDate: () => mockData.updatedAt },
            }),
          },
        ],
      });

      const result = await rateLimitRepository.findByIP('192.168.1.1', 'registration');

      expect(result).toBeDefined();
      expect(result?.id).toBe('entry789');
      expect(result?.ipAddress).toBe('192.168.1.1');
      expect(result?.resourceType).toBe('registration');
      expect(result?.count).toBe(4);
      expect(mockWhere).toHaveBeenCalledWith('ipAddress', '==', '192.168.1.1');
      expect(mockWhere).toHaveBeenCalledWith('resourceType', '==', 'registration');
    });

    it('should return null when no entry is found', async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await rateLimitRepository.findByIP('192.168.1.1', 'registration');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on failure', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      await expect(
        rateLimitRepository.findByIP('192.168.1.1', 'registration')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('incrementCount', () => {
    it('should increment count for existing entry', async () => {
      const existingData = {
        id: 'entry123',
        userId: 'user123',
        resourceType: 'property_creation' as RateLimitResourceType,
        count: 3,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-02T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      // Mock finding existing entry
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'entry123',
            data: () => ({
              ...existingData,
              windowStart: { toDate: () => existingData.windowStart },
              windowEnd: { toDate: () => existingData.windowEnd },
              createdAt: { toDate: () => existingData.createdAt },
              updatedAt: { toDate: () => existingData.updatedAt },
            }),
          },
        ],
      });

      mockUpdate.mockResolvedValue(undefined);

      const result = await rateLimitRepository.incrementCount({
        userId: 'user123',
        resourceType: 'property_creation',
        count: 1,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-02T00:00:00Z'),
      });

      expect(result.count).toBe(4);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should create new entry when none exists', async () => {
      // Mock no existing entry
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      mockSet.mockResolvedValue(undefined);

      const newData = {
        userId: 'user123',
        resourceType: 'property_creation' as RateLimitResourceType,
        count: 1,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-02T00:00:00Z'),
      };

      const result = await rateLimitRepository.incrementCount(newData);

      expect(result.count).toBe(1);
      expect(result.userId).toBe('user123');
      expect(mockSet).toHaveBeenCalled();
    });

    it('should handle IP-based rate limits', async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      mockSet.mockResolvedValue(undefined);

      const newData = {
        ipAddress: '192.168.1.1',
        resourceType: 'registration' as RateLimitResourceType,
        count: 1,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-01T01:00:00Z'),
      };

      const result = await rateLimitRepository.incrementCount(newData);

      expect(result.count).toBe(1);
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(mockSet).toHaveBeenCalled();
    });

    it('should throw DatabaseError on failure', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      await expect(
        rateLimitRepository.incrementCount({
          userId: 'user123',
          resourceType: 'property_creation',
          count: 1,
          windowStart: new Date(),
          windowEnd: new Date(),
        })
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('resetCount', () => {
    it('should delete rate limit entry', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ count: 5 }),
      });
      mockDelete.mockResolvedValue(undefined);

      await rateLimitRepository.resetCount('entry123');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle non-existent entry gracefully', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        rateLimitRepository.resetCount('nonexistent')
      ).resolves.not.toThrow();
    });

    it('should throw DatabaseError on failure', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      await expect(
        rateLimitRepository.resetCount('entry123')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired rate limit entries', async () => {
      const mockDocs = [
        { ref: { id: 'entry1' } },
        { ref: { id: 'entry2' } },
        { ref: { id: 'entry3' } },
      ];

      mockGet.mockResolvedValue({
        empty: false,
        size: 3,
        docs: mockDocs,
      });

      mockBatchCommit.mockResolvedValue(undefined);

      const deletedCount = await rateLimitRepository.deleteExpired();

      expect(deletedCount).toBe(3);
      expect(mockBatchDelete).toHaveBeenCalledTimes(3);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('should return 0 when no expired entries exist', async () => {
      mockGet.mockResolvedValue({ empty: true, size: 0, docs: [] });

      const deletedCount = await rateLimitRepository.deleteExpired();

      expect(deletedCount).toBe(0);
      expect(mockBatchCommit).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on failure', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));

      await expect(
        rateLimitRepository.deleteExpired()
      ).rejects.toThrow(DatabaseError);
    });
  });
});
