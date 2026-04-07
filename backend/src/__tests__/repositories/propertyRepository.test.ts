import propertyRepository from '../../repositories/propertyRepository';
import { getFirebaseFirestore } from '../../config/firebase';
import { DatabaseError, NotFoundError } from '../../middleware/errorHandler';
import { PropertyType, PropertyStatus } from '../../types';

// Mock Firebase
jest.mock('../../config/firebase');

describe('PropertyRepository', () => {
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockWhere: jest.Mock;
  let mockOrderBy: jest.Mock;
  let mockLimit: jest.Mock;
  let mockOffset: jest.Mock;

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
    mockOffset = jest.fn();

    // Setup mock document
    mockDoc = jest.fn(() => ({
      id: 'property123',
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
      delete: mockDelete,
    }));

    // Setup mock collection with chainable query methods
    mockCollection = jest.fn(() => {
      const queryChain = {
        doc: mockDoc,
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit,
        offset: mockOffset,
        get: mockGet,
      };

      // Make methods chainable
      mockWhere.mockReturnValue(queryChain);
      mockOrderBy.mockReturnValue(queryChain);
      mockLimit.mockReturnValue(queryChain);
      mockOffset.mockReturnValue(queryChain);

      return queryChain;
    });

    // Mock Firestore
    (getFirebaseFirestore as jest.Mock).mockReturnValue({
      collection: mockCollection,
    });
  });

  describe('create', () => {
    it('should create a new property successfully', async () => {
      const propertyData = {
        title: 'Beautiful House',
        description: 'A lovely 3-bedroom house',
        price: 500000,
        region: 'north',
        address: '123 Main St',
        propertyType: 'house' as PropertyType,
        status: 'available' as PropertyStatus,
        sellerId: 'seller123',
      };

      mockSet.mockResolvedValue(undefined);

      const result = await propertyRepository.create(propertyData);

      expect(mockCollection).toHaveBeenCalledWith('properties');
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          ...propertyData,
          imageUrls: [],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toMatchObject({
        id: 'property123',
        ...propertyData,
        imageUrls: [],
      });
    });

    it('should create property with imageUrls if provided', async () => {
      const propertyData = {
        title: 'Beautiful House',
        description: 'A lovely 3-bedroom house',
        price: 500000,
        region: 'north',
        address: '123 Main St',
        propertyType: 'house' as PropertyType,
        status: 'available' as PropertyStatus,
        sellerId: 'seller123',
        imageUrls: ['https://example.com/image1.jpg'],
      };

      mockSet.mockResolvedValue(undefined);

      await propertyRepository.create(propertyData);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrls: ['https://example.com/image1.jpg'],
        })
      );
    });

    it('should throw DatabaseError on Firestore failure', async () => {
      const propertyData = {
        title: 'Beautiful House',
        description: 'A lovely 3-bedroom house',
        price: 500000,
        region: 'north',
        address: '123 Main St',
        propertyType: 'house' as PropertyType,
        status: 'available' as PropertyStatus,
        sellerId: 'seller123',
      };

      mockSet.mockRejectedValue(new Error('Firestore error'));

      await expect(propertyRepository.create(propertyData)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('findById', () => {
    it('should find a property by ID successfully', async () => {
      const mockPropertyData = {
        title: 'Beautiful House',
        description: 'A lovely 3-bedroom house',
        price: 500000,
        region: 'north',
        address: '123 Main St',
        propertyType: 'house',
        status: 'available',
        sellerId: 'seller123',
        imageUrls: [],
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      };

      mockGet.mockResolvedValue({
        exists: true,
        id: 'property123',
        data: () => mockPropertyData,
      });

      const result = await propertyRepository.findById('property123');

      expect(mockCollection).toHaveBeenCalledWith('properties');
      expect(mockDoc).toHaveBeenCalledWith('property123');
      expect(result).toMatchObject({
        id: 'property123',
        title: 'Beautiful House',
      });
    });

    it('should return null if property does not exist', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      const result = await propertyRepository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on Firestore failure', async () => {
      mockGet.mockRejectedValue(new Error('Firestore error'));

      await expect(
        propertyRepository.findById('property123')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('findBySellerId', () => {
    it('should find properties by seller ID with pagination', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          title: 'House 1',
          sellerId: 'seller123',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        },
        {
          id: 'prop2',
          title: 'House 2',
          sellerId: 'seller123',
          createdAt: { toDate: () => new Date('2024-01-02') },
          updatedAt: { toDate: () => new Date('2024-01-02') },
        },
      ];

      // Mock count query
      mockGet.mockResolvedValueOnce({
        size: 2,
      });

      // Mock paginated query
      mockGet.mockResolvedValueOnce({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyRepository.findBySellerId('seller123', 1, 10);

      expect(mockWhere).toHaveBeenCalledWith('sellerId', '==', 'seller123');
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(0);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should throw DatabaseError on Firestore failure', async () => {
      mockGet.mockRejectedValue(new Error('Firestore error'));

      await expect(
        propertyRepository.findBySellerId('seller123')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    it('should update a property successfully', async () => {
      const updateData = {
        title: 'Updated House',
        price: 550000,
      };

      // Mock property exists check
      mockGet.mockResolvedValueOnce({
        exists: true,
      });

      mockUpdate.mockResolvedValue(undefined);

      // Mock fetching updated property
      mockGet.mockResolvedValueOnce({
        id: 'property123',
        data: () => ({
          title: 'Updated House',
          price: 550000,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date() },
        }),
      });

      const result = await propertyRepository.update('property123', updateData);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date),
        })
      );
      expect(result.title).toBe('Updated House');
    });

    it('should throw NotFoundError if property does not exist', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      await expect(
        propertyRepository.update('nonexistent', { title: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError on Firestore failure', async () => {
      mockGet.mockResolvedValue({
        exists: true,
      });
      mockUpdate.mockRejectedValue(new Error('Firestore error'));

      await expect(
        propertyRepository.update('property123', { title: 'Updated' })
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('delete', () => {
    it('should delete a property successfully', async () => {
      mockGet.mockResolvedValue({
        exists: true,
      });
      mockDelete.mockResolvedValue(undefined);

      await propertyRepository.delete('property123');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw NotFoundError if property does not exist', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      await expect(propertyRepository.delete('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw DatabaseError on Firestore failure', async () => {
      mockGet.mockResolvedValue({
        exists: true,
      });
      mockDelete.mockRejectedValue(new Error('Firestore error'));

      await expect(propertyRepository.delete('property123')).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('search', () => {
    const mockProperties = [
      {
        id: 'prop1',
        title: 'Luxury Apartment',
        description: 'Modern apartment in downtown',
        price: 300000,
        region: 'north',
        propertyType: 'apartment',
        status: 'available',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      },
      {
        id: 'prop2',
        title: 'Cozy House',
        description: 'Family house with garden',
        price: 500000,
        region: 'south',
        propertyType: 'house',
        status: 'available',
        createdAt: { toDate: () => new Date('2024-01-02') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
      },
    ];

    it('should search properties with status filter', async () => {
      mockGet.mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyRepository.search({
        status: 'available',
      });

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'available');
      expect(result.data).toHaveLength(2);
    });

    it('should search properties with region filter', async () => {
      mockGet.mockResolvedValue({
        docs: [mockProperties[0]].map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      await propertyRepository.search({
        region: 'north',
      });

      expect(mockWhere).toHaveBeenCalledWith('region', '==', 'north');
    });

    it('should search properties with price range filter', async () => {
      mockGet.mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyRepository.search({
        minPrice: 250000,
        maxPrice: 400000,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].price).toBe(300000);
    });

    it('should search properties with keyword (case-insensitive)', async () => {
      mockGet.mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyRepository.search({
        keyword: 'LUXURY',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Luxury Apartment');
    });

    it('should search properties with sorting', async () => {
      mockGet.mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyRepository.search({
        sortBy: 'price',
        sortOrder: 'asc',
      });

      expect(result.data[0].price).toBe(300000);
      expect(result.data[1].price).toBe(500000);
    });

    it('should handle pagination correctly', async () => {
      mockGet.mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyRepository.search({
        page: 1,
        limit: 1,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
    });

    it('should throw DatabaseError on Firestore failure', async () => {
      mockGet.mockRejectedValue(new Error('Firestore error'));

      await expect(propertyRepository.search({})).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('getAvailableProperties', () => {
    it('should get available properties', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          status: 'available',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockProperties.map((prop) => ({
          id: prop.id,
          data: () => prop,
        })),
      });

      const result = await propertyRepository.getAvailableProperties(1, 10);

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'available');
      expect(result.data).toHaveLength(1);
    });
  });
});
