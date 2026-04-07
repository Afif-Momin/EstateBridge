import propertyService from '../../services/propertyService';
import propertyRepository from '../../repositories/propertyRepository';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../../middleware/errorHandler';
import { PropertyType, PropertyStatus } from '../../types';

// Mock the repository
jest.mock('../../repositories/propertyRepository');

// Mock Firebase
jest.mock('../../config/firebase', () => ({
  getFirebaseFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() =>
          Promise.resolve({
            data: jest.fn(() => ({ currency: 'USD' })),
          })
        ),
      })),
    })),
  })),
}));

describe('PropertyService', () => {
  const mockSellerId = 'seller123';
  const mockPropertyId = 'property123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    const validPropertyData = {
      title: 'Beautiful House',
      description: 'A lovely 3-bedroom house with a garden',
      price: 500000,
      region: 'north',
      address: '123 Main Street, City',
      propertyType: 'house' as PropertyType,
      status: 'available' as PropertyStatus,
      sellerId: mockSellerId,
    };

    it('should create a property with valid data', async () => {
      const mockProperty = {
        id: mockPropertyId,
        ...validPropertyData,
        imageUrls: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (propertyRepository.create as jest.Mock).mockResolvedValue(mockProperty);

      const result = await propertyService.createProperty(
        validPropertyData,
        mockSellerId
      );

      expect(propertyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validPropertyData,
          sellerId: mockSellerId,
        })
      );
      expect(result).toEqual(mockProperty);
    });

    it('should throw ValidationError for invalid price', async () => {
      const invalidData = {
        ...validPropertyData,
        price: -100,
      };

      await expect(
        propertyService.createProperty(invalidData, mockSellerId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for title too short', async () => {
      const invalidData = {
        ...validPropertyData,
        title: 'Hi',
      };

      await expect(
        propertyService.createProperty(invalidData, mockSellerId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for title too long', async () => {
      const invalidData = {
        ...validPropertyData,
        title: 'A'.repeat(201),
      };

      await expect(
        propertyService.createProperty(invalidData, mockSellerId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for description too short', async () => {
      const invalidData = {
        ...validPropertyData,
        description: 'Too short',
      };

      await expect(
        propertyService.createProperty(invalidData, mockSellerId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for description too long', async () => {
      const invalidData = {
        ...validPropertyData,
        description: 'A'.repeat(2001),
      };

      await expect(
        propertyService.createProperty(invalidData, mockSellerId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for address too short', async () => {
      const invalidData = {
        ...validPropertyData,
        address: '123 St',
      };

      await expect(
        propertyService.createProperty(invalidData, mockSellerId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for address too long', async () => {
      const invalidData = {
        ...validPropertyData,
        address: 'A'.repeat(501),
      };

      await expect(
        propertyService.createProperty(invalidData, mockSellerId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateProperty', () => {
    const existingProperty = {
      id: mockPropertyId,
      title: 'Old Title',
      description: 'Old description that is long enough',
      price: 400000,
      region: 'north',
      address: '123 Main Street, City',
      propertyType: 'house' as PropertyType,
      status: 'available' as PropertyStatus,
      sellerId: mockSellerId,
      imageUrls: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update property with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        price: 550000,
      };

      (propertyRepository.findById as jest.Mock).mockResolvedValue(
        existingProperty
      );
      (propertyRepository.update as jest.Mock).mockResolvedValue({
        ...existingProperty,
        ...updateData,
      });

      const result = await propertyService.updateProperty(
        mockPropertyId,
        updateData,
        mockSellerId
      );

      expect(propertyRepository.findById).toHaveBeenCalledWith(mockPropertyId);
      expect(propertyRepository.update).toHaveBeenCalledWith(
        mockPropertyId,
        updateData
      );
      expect(result.title).toBe(updateData.title);
    });

    it('should throw NotFoundError if property does not exist', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        propertyService.updateProperty(
          mockPropertyId,
          { title: 'New Title' },
          mockSellerId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if seller does not own property', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue({
        ...existingProperty,
        sellerId: 'differentSeller',
      });

      await expect(
        propertyService.updateProperty(
          mockPropertyId,
          { title: 'New Title' },
          mockSellerId
        )
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError for invalid price update', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(
        existingProperty
      );

      await expect(
        propertyService.updateProperty(
          mockPropertyId,
          { price: -100 },
          mockSellerId
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid title length', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(
        existingProperty
      );

      await expect(
        propertyService.updateProperty(
          mockPropertyId,
          { title: 'Hi' },
          mockSellerId
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteProperty', () => {
    const existingProperty = {
      id: mockPropertyId,
      title: 'Property to Delete',
      description: 'This property will be deleted',
      price: 400000,
      region: 'north',
      address: '123 Main Street, City',
      propertyType: 'house' as PropertyType,
      status: 'available' as PropertyStatus,
      sellerId: mockSellerId,
      imageUrls: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should delete property successfully', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(
        existingProperty
      );
      (propertyRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await propertyService.deleteProperty(mockPropertyId, mockSellerId);

      expect(propertyRepository.findById).toHaveBeenCalledWith(mockPropertyId);
      expect(propertyRepository.delete).toHaveBeenCalledWith(mockPropertyId);
    });

    it('should throw NotFoundError if property does not exist', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        propertyService.deleteProperty(mockPropertyId, mockSellerId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if seller does not own property', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue({
        ...existingProperty,
        sellerId: 'differentSeller',
      });

      await expect(
        propertyService.deleteProperty(mockPropertyId, mockSellerId)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('getPropertyById', () => {
    it('should return property if found', async () => {
      const mockProperty = {
        id: mockPropertyId,
        title: 'Test Property',
        description: 'A test property description',
        price: 400000,
        region: 'north',
        address: '123 Main Street, City',
        propertyType: 'house' as PropertyType,
        status: 'available' as PropertyStatus,
        sellerId: mockSellerId,
        imageUrls: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (propertyRepository.findById as jest.Mock).mockResolvedValue(
        mockProperty
      );

      const result = await propertyService.getPropertyById(mockPropertyId);

      expect(propertyRepository.findById).toHaveBeenCalledWith(mockPropertyId);
      expect(result).toEqual(mockProperty);
    });

    it('should throw NotFoundError if property not found', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        propertyService.getPropertyById(mockPropertyId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPropertiesBySeller', () => {
    it('should return paginated properties for seller', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          title: 'Property 1',
          sellerId: mockSellerId,
        },
        {
          id: 'prop2',
          title: 'Property 2',
          sellerId: mockSellerId,
        },
      ];

      const mockResult = {
        data: mockProperties,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      (propertyRepository.findBySellerId as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await propertyService.getPropertiesBySeller(
        mockSellerId,
        1,
        10
      );

      expect(propertyRepository.findBySellerId).toHaveBeenCalledWith(
        mockSellerId,
        1,
        10
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('updatePropertyStatus', () => {
    const existingProperty = {
      id: mockPropertyId,
      title: 'Property',
      description: 'A property description',
      price: 400000,
      region: 'north',
      address: '123 Main Street, City',
      propertyType: 'house' as PropertyType,
      status: 'available' as PropertyStatus,
      sellerId: mockSellerId,
      imageUrls: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update property status successfully', async () => {
      const newStatus: PropertyStatus = 'under_offer';

      (propertyRepository.findById as jest.Mock).mockResolvedValue(
        existingProperty
      );
      (propertyRepository.update as jest.Mock).mockResolvedValue({
        ...existingProperty,
        status: newStatus,
      });

      const result = await propertyService.updatePropertyStatus(
        mockPropertyId,
        newStatus,
        mockSellerId
      );

      expect(propertyRepository.update).toHaveBeenCalledWith(mockPropertyId, {
        status: newStatus,
      });
      expect(result.status).toBe(newStatus);
    });

    it('should throw NotFoundError if property does not exist', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        propertyService.updatePropertyStatus(
          mockPropertyId,
          'sold',
          mockSellerId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if seller does not own property', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue({
        ...existingProperty,
        sellerId: 'differentSeller',
      });

      await expect(
        propertyService.updatePropertyStatus(
          mockPropertyId,
          'sold',
          mockSellerId
        )
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError for invalid status', async () => {
      (propertyRepository.findById as jest.Mock).mockResolvedValue(
        existingProperty
      );

      await expect(
        propertyService.updatePropertyStatus(
          mockPropertyId,
          'invalid_status' as PropertyStatus,
          mockSellerId
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should allow all valid status transitions', async () => {
      const validStatuses: PropertyStatus[] = [
        'available',
        'under_offer',
        'sold',
      ];

      for (const status of validStatuses) {
        (propertyRepository.findById as jest.Mock).mockResolvedValue(
          existingProperty
        );
        (propertyRepository.update as jest.Mock).mockResolvedValue({
          ...existingProperty,
          status,
        });

        const result = await propertyService.updatePropertyStatus(
          mockPropertyId,
          status,
          mockSellerId
        );

        expect(result.status).toBe(status);
      }
    });
  });
});
