/**
 * Unit tests for Image Compression Service
 */

import imageCompressionService from '../../services/imageCompressionService';
import * as imageProcessor from '../../utils/imageProcessor';
import { getFirebaseStorage } from '../../config/firebase';
import { sharpConfig } from '../../config/sharp';

// Mock dependencies
jest.mock('../../config/firebase');
jest.mock('../../utils/imageProcessor');
jest.mock('../../utils/logger');

describe('ImageCompressionService', () => {
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock file
    mockFile = {
      save: jest.fn().mockResolvedValue(undefined),
      makePublic: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock bucket
    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
      getFiles: jest.fn().mockResolvedValue([[]]),
      name: 'test-bucket',
    };

    // Setup mock storage
    (getFirebaseStorage as jest.Mock).mockReturnValue({
      bucket: jest.fn().mockReturnValue(mockBucket),
    });
  });

  describe('validateImage', () => {
    it('should validate image successfully when size and type are valid', () => {
      const buffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const mimeType = 'image/jpeg';

      (imageProcessor.validateImage as jest.Mock).mockReturnValue({
        valid: true,
      });

      const result = imageCompressionService.validateImage(buffer, mimeType);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(imageProcessor.validateImage).toHaveBeenCalledWith(buffer, mimeType);
    });

    it('should reject image when size exceeds 10MB limit', () => {
      const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const mimeType = 'image/jpeg';

      (imageProcessor.validateImage as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Image size exceeds 10MB limit',
      });

      const result = imageCompressionService.validateImage(buffer, mimeType);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image size exceeds 10MB limit');
    });

    it('should reject image with invalid MIME type', () => {
      const buffer = Buffer.alloc(1024);
      const mimeType = 'image/gif';

      (imageProcessor.validateImage as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Image type image/gif not allowed. Allowed types: image/jpeg, image/jpg, image/png, image/webp',
      });

      const result = imageCompressionService.validateImage(buffer, mimeType);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should accept all allowed MIME types', () => {
      const buffer = Buffer.alloc(1024);
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      allowedTypes.forEach((mimeType) => {
        (imageProcessor.validateImage as jest.Mock).mockReturnValue({
          valid: true,
        });

        const result = imageCompressionService.validateImage(buffer, mimeType);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('compressAndUpload', () => {
    const propertyId = 'prop-123';
    const imageId = 'img-456';
    const originalBuffer = Buffer.from('original-image-data');
    const compressedBuffer = Buffer.from('compressed-image-data');
    const thumbnailBuffer = Buffer.from('thumbnail-image-data');

    beforeEach(() => {
      (imageProcessor.compressFullSize as jest.Mock).mockResolvedValue(compressedBuffer);
      (imageProcessor.generateThumbnail as jest.Mock).mockResolvedValue(thumbnailBuffer);
      (imageProcessor.generateImageFileNames as jest.Mock).mockReturnValue({
        fullName: `${propertyId}/${imageId}_full.jpg`,
        thumbName: `${propertyId}/${imageId}_thumb.jpg`,
      });
    });

    it('should compress and upload both full-size and thumbnail images', async () => {
      const result = await imageCompressionService.compressAndUpload(
        originalBuffer,
        propertyId,
        imageId
      );

      // Verify compression was called
      expect(imageProcessor.compressFullSize).toHaveBeenCalledWith(originalBuffer);
      expect(imageProcessor.generateThumbnail).toHaveBeenCalledWith(originalBuffer);

      // Verify file names were generated
      expect(imageProcessor.generateImageFileNames).toHaveBeenCalledWith(propertyId, imageId);

      // Verify both files were uploaded
      expect(mockBucket.file).toHaveBeenCalledWith(`${propertyId}/${imageId}_full.jpg`);
      expect(mockBucket.file).toHaveBeenCalledWith(`${propertyId}/${imageId}_thumb.jpg`);
      expect(mockFile.save).toHaveBeenCalledTimes(2);
      expect(mockFile.makePublic).toHaveBeenCalledTimes(2);

      // Verify URLs are returned
      expect(result.fullUrl).toBe(`https://storage.googleapis.com/test-bucket/${propertyId}/${imageId}_full.jpg`);
      expect(result.thumbnailUrl).toBe(`https://storage.googleapis.com/test-bucket/${propertyId}/${imageId}_thumb.jpg`);
    });

    it('should save full-size image with correct metadata', async () => {
      await imageCompressionService.compressAndUpload(originalBuffer, propertyId, imageId);

      const fullSizeSaveCall = mockFile.save.mock.calls[0];
      expect(fullSizeSaveCall[0]).toBe(compressedBuffer);
      expect(fullSizeSaveCall[1]).toMatchObject({
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            propertyId,
            imageId,
            version: 'full',
            compressed: 'true',
          },
        },
      });
    });

    it('should save thumbnail with correct metadata', async () => {
      await imageCompressionService.compressAndUpload(originalBuffer, propertyId, imageId);

      const thumbnailSaveCall = mockFile.save.mock.calls[1];
      expect(thumbnailSaveCall[0]).toBe(thumbnailBuffer);
      expect(thumbnailSaveCall[1]).toMatchObject({
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            propertyId,
            imageId,
            version: 'thumbnail',
            compressed: 'true',
          },
        },
      });
    });

    it('should use naming pattern {propertyId}/{imageId}_full.jpg and _thumb.jpg', async () => {
      await imageCompressionService.compressAndUpload(originalBuffer, propertyId, imageId);

      expect(mockBucket.file).toHaveBeenCalledWith(`${propertyId}/${imageId}_full.jpg`);
      expect(mockBucket.file).toHaveBeenCalledWith(`${propertyId}/${imageId}_thumb.jpg`);
    });

    it('should throw ValidationError when compression fails', async () => {
      const error = new Error('Compression failed');
      (imageProcessor.compressFullSize as jest.Mock).mockRejectedValue(error);

      await expect(
        imageCompressionService.compressAndUpload(originalBuffer, propertyId, imageId)
      ).rejects.toThrow('Failed to compress and upload image: Compression failed');
    });

    it('should throw ValidationError when upload fails', async () => {
      const error = new Error('Upload failed');
      mockFile.save.mockRejectedValue(error);

      await expect(
        imageCompressionService.compressAndUpload(originalBuffer, propertyId, imageId)
      ).rejects.toThrow('Failed to compress and upload image: Upload failed');
    });

    it('should make both images publicly accessible', async () => {
      await imageCompressionService.compressAndUpload(originalBuffer, propertyId, imageId);

      expect(mockFile.makePublic).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteImage', () => {
    const propertyId = 'prop-123';
    const imageId = 'img-456';

    beforeEach(() => {
      (imageProcessor.generateImageFileNames as jest.Mock).mockReturnValue({
        fullName: `${propertyId}/${imageId}_full.jpg`,
        thumbName: `${propertyId}/${imageId}_thumb.jpg`,
      });
    });

    it('should delete both full-size and thumbnail images', async () => {
      await imageCompressionService.deleteImage(propertyId, imageId);

      expect(mockBucket.file).toHaveBeenCalledWith(`${propertyId}/${imageId}_full.jpg`);
      expect(mockBucket.file).toHaveBeenCalledWith(`${propertyId}/${imageId}_thumb.jpg`);
      expect(mockFile.delete).toHaveBeenCalledTimes(2);
    });

    it('should not throw error if files do not exist', async () => {
      mockFile.delete.mockRejectedValue(new Error('File not found'));

      await expect(
        imageCompressionService.deleteImage(propertyId, imageId)
      ).resolves.not.toThrow();
    });

    it('should handle partial deletion gracefully', async () => {
      mockFile.delete
        .mockResolvedValueOnce(undefined) // First delete succeeds
        .mockRejectedValueOnce(new Error('File not found')); // Second delete fails

      await expect(
        imageCompressionService.deleteImage(propertyId, imageId)
      ).resolves.not.toThrow();
    });
  });

  describe('deletePropertyImages', () => {
    const propertyId = 'prop-123';

    it('should delete all images for a property', async () => {
      const mockFiles = [
        { delete: jest.fn().mockResolvedValue(undefined) },
        { delete: jest.fn().mockResolvedValue(undefined) },
        { delete: jest.fn().mockResolvedValue(undefined) },
      ];

      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      await imageCompressionService.deletePropertyImages(propertyId);

      expect(mockBucket.getFiles).toHaveBeenCalledWith({ prefix: `${propertyId}/` });
      expect(mockFiles[0].delete).toHaveBeenCalled();
      expect(mockFiles[1].delete).toHaveBeenCalled();
      expect(mockFiles[2].delete).toHaveBeenCalled();
    });

    it('should handle case when no images exist', async () => {
      mockBucket.getFiles.mockResolvedValue([[]]);

      await expect(
        imageCompressionService.deletePropertyImages(propertyId)
      ).resolves.not.toThrow();

      expect(mockBucket.getFiles).toHaveBeenCalledWith({ prefix: `${propertyId}/` });
    });

    it('should not throw error if deletion fails', async () => {
      const mockFiles = [
        { delete: jest.fn().mockRejectedValue(new Error('Delete failed')) },
      ];

      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      await expect(
        imageCompressionService.deletePropertyImages(propertyId)
      ).resolves.not.toThrow();
    });

    it('should use correct prefix pattern for property folder', async () => {
      mockBucket.getFiles.mockResolvedValue([[]]);

      await imageCompressionService.deletePropertyImages(propertyId);

      expect(mockBucket.getFiles).toHaveBeenCalledWith({ prefix: `${propertyId}/` });
    });
  });

  describe('Integration with Sharp configuration', () => {
    it('should use configuration values from sharpConfig', () => {
      // Verify that the service relies on sharpConfig values
      expect(sharpConfig.validation.maxFileSizeBytes).toBe(10 * 1024 * 1024);
      expect(sharpConfig.fullSize.maxWidth).toBe(1920);
      expect(sharpConfig.thumbnail.width).toBe(400);
      expect(sharpConfig.jpeg.quality).toBe(85);
      expect(sharpConfig.naming.fullSuffix).toBe('_full.jpg');
      expect(sharpConfig.naming.thumbSuffix).toBe('_thumb.jpg');
    });
  });
});
