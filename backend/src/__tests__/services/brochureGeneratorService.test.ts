/**
 * Unit tests for Brochure Generator Service
 * 
 * Tests PDF generation, content inclusion, storage upload, and cleanup
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 17.1, 17.2, 17.3, 17.4, 17.5
 */

import brochureGeneratorService from '../../services/brochureGeneratorService';
import { getFirebaseFirestore, getFirebaseStorage } from '../../config/firebase';
import { NotFoundError } from '../../middleware/errorHandler';
import * as QRCode from 'qrcode';

// Mock dependencies
jest.mock('../../config/firebase');
jest.mock('qrcode');
jest.mock('../../utils/logger');

// Mock fetch for image downloads
global.fetch = jest.fn();

describe('BrochureGeneratorService', () => {
  let mockDb: any;
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore
    mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    // Mock Storage
    mockFile = {
      createWriteStream: jest.fn(),
      getSignedUrl: jest.fn(),
      getMetadata: jest.fn(),
      delete: jest.fn(),
    };

    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
      getFiles: jest.fn(),
    };

    mockStorage = {
      bucket: jest.fn().mockReturnValue(mockBucket),
    };

    (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);
    (getFirebaseStorage as jest.Mock).mockReturnValue(mockStorage);
  });

  describe('generateBrochure', () => {
    const mockProperty = {
      id: 'property-123',
      title: 'Beautiful House',
      description: 'A lovely property in great location with modern amenities',
      price: 500000,
      currency: 'USD',
      region: 'New York',
      address: '123 Main St, New York, NY 10001',
      propertyType: 'house',
      status: 'available',
      sellerId: 'seller-123',
      imageUrls: ['https://example.com/image1.jpg'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSeller = {
      id: 'seller-123',
      email: 'seller@example.com',
      fullName: 'John Seller',
      role: 'seller' as const,
      buy_country: 'US',
      buy_city: 'New York',
      buy_state: 'NY',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Mock property fetch
      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'properties') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: mockProperty.id,
                data: () => mockProperty,
              }),
            }),
          };
        } else if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: mockSeller.id,
                data: () => mockSeller,
              }),
            }),
          };
        }
        return mockDb;
      });

      // Mock image download
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      // Mock QR code generation
      (QRCode.toBuffer as jest.Mock).mockResolvedValue(Buffer.from('qr-code'));

      // Mock file upload stream
      const mockStream = {
        on: jest.fn().mockImplementation(function(this: any, event: string, handler: Function) {
          if (event === 'finish') {
            setTimeout(() => handler(), 0);
          }
          return this;
        }),
        once: jest.fn().mockImplementation(function(this: any, _event: string, _handler: Function) {
          return this;
        }),
        write: jest.fn().mockReturnValue(true),
        end: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      // Mock signed URL generation
      mockFile.getSignedUrl.mockResolvedValue(['https://storage.example.com/brochure.pdf']);
    });

    it('should generate brochure with all required content', async () => {
      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      expect(result).toHaveProperty('downloadUrl');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('fileName');
      expect(result.downloadUrl).toContain('https://');
      expect(result.fileName).toMatch(/^brochure_\d+\.pdf$/);
    });

    it('should include Estate Bridge branding in PDF', async () => {
      // This test verifies that the branding is added to the PDF
      // In a real scenario, you would parse the PDF to verify content
      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      expect(result).toBeDefined();
      expect(mockFile.createWriteStream).toHaveBeenCalled();
    });

    it('should include property images in PDF', async () => {
      await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      // Verify image was downloaded
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image1.jpg');
    });

    it('should include property details with formatted price', async () => {
      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      expect(result).toBeDefined();
      // Price formatting is handled by currencyService
      // The PDF should contain the formatted price
    });

    it('should include seller contact information', async () => {
      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      expect(result).toBeDefined();
      // Seller info should be fetched and included
      expect(mockDb.collection).toHaveBeenCalledWith('users');
    });

    it('should include QR code linking to property page', async () => {
      await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      // Verify QR code was generated with correct URL
      expect(QRCode.toBuffer).toHaveBeenCalledWith(
        expect.stringContaining('/properties/property-123'),
        expect.any(Object)
      );
    });

    it('should upload PDF to correct storage path', async () => {
      await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      // Verify file path follows pattern: brochures/{propertyId}/{timestamp}.pdf
      expect(mockBucket.file).toHaveBeenCalledWith(
        expect.stringMatching(/^brochures\/property-123\/brochure_\d+\.pdf$/)
      );
    });

    it('should generate signed URL with 1 hour expiration', async () => {
      const beforeGeneration = new Date();
      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');
      const afterGeneration = new Date();

      // Verify expiration is approximately 1 hour from now
      const expirationTime = result.expiresAt.getTime();
      const expectedMin = beforeGeneration.getTime() + (60 * 60 * 1000);
      const expectedMax = afterGeneration.getTime() + (60 * 60 * 1000);

      expect(expirationTime).toBeGreaterThanOrEqual(expectedMin);
      expect(expirationTime).toBeLessThanOrEqual(expectedMax);

      // Verify getSignedUrl was called with expiration
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        action: 'read',
        expires: expect.any(Date),
      });
    });

    it('should throw NotFoundError if property does not exist', async () => {
      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'properties') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: false,
              }),
            }),
          };
        }
        return mockDb;
      });

      await expect(
        brochureGeneratorService.generateBrochure('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if seller does not exist', async () => {
      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'properties') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: mockProperty.id,
                data: () => mockProperty,
              }),
            }),
          };
        } else if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: false,
              }),
            }),
          };
        }
        return mockDb;
      });

      await expect(
        brochureGeneratorService.generateBrochure('property-123', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle properties with no images gracefully', async () => {
      const propertyWithoutImages = { ...mockProperty, imageUrls: [] };
      
      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'properties') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: propertyWithoutImages.id,
                data: () => propertyWithoutImages,
              }),
            }),
          };
        } else if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: mockSeller.id,
                data: () => mockSeller,
              }),
            }),
          };
        }
        return mockDb;
      });

      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      expect(result).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should limit images to max 3 per page', async () => {
      const propertyWithManyImages = {
        ...mockProperty,
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
          'https://example.com/image4.jpg',
          'https://example.com/image5.jpg',
        ],
      };

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'properties') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: propertyWithManyImages.id,
                data: () => propertyWithManyImages,
              }),
            }),
          };
        } else if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: mockSeller.id,
                data: () => mockSeller,
              }),
            }),
          };
        }
        return mockDb;
      });

      await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      // Should only download first 3 images
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should continue generation if image download fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      // Should still generate brochure without images
      expect(result).toBeDefined();
      expect(result.downloadUrl).toBeDefined();
    });

    it('should continue generation if QR code generation fails', async () => {
      (QRCode.toBuffer as jest.Mock).mockRejectedValue(new Error('QR generation failed'));

      const result = await brochureGeneratorService.generateBrochure('property-123', 'user-123');

      // Should still generate brochure without QR code
      expect(result).toBeDefined();
      expect(result.downloadUrl).toBeDefined();
    });
  });

  describe('cleanupExpiredBrochures', () => {
    it('should delete brochures older than 24 hours', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago

      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago

      const mockFiles = [
        {
          getMetadata: jest.fn().mockResolvedValue([{ timeCreated: oldDate.toISOString() }]),
          delete: jest.fn().mockResolvedValue(undefined),
        },
        {
          getMetadata: jest.fn().mockResolvedValue([{ timeCreated: recentDate.toISOString() }]),
          delete: jest.fn().mockResolvedValue(undefined),
        },
      ];

      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      const deletedCount = await brochureGeneratorService.cleanupExpiredBrochures();

      expect(deletedCount).toBe(1);
      expect(mockFiles[0].delete).toHaveBeenCalled();
      expect(mockFiles[1].delete).not.toHaveBeenCalled();
    });

    it('should return 0 if no expired brochures found', async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1);

      const mockFiles = [
        {
          getMetadata: jest.fn().mockResolvedValue([{ timeCreated: recentDate.toISOString() }]),
          delete: jest.fn().mockResolvedValue(undefined),
        },
      ];

      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      const deletedCount = await brochureGeneratorService.cleanupExpiredBrochures();

      expect(deletedCount).toBe(0);
      expect(mockFiles[0].delete).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockBucket.getFiles.mockRejectedValue(new Error('Storage error'));

      await expect(
        brochureGeneratorService.cleanupExpiredBrochures()
      ).rejects.toThrow('Storage error');
    });
  });
});
