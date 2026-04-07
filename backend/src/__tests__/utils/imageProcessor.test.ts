/**
 * Tests for Image Processor Utility
 * Validates image processing functions using Sharp
 */

import {
  validateImage,
  compressFullSize,
  generateThumbnail,
  getImageMetadata,
  generateImageFileNames,
} from '../../utils/imageProcessor';
import { sharpConfig } from '../../config/sharp';

describe('Image Processor Utility', () => {
  describe('validateImage', () => {
    it('should accept valid JPEG image under 10MB', () => {
      const buffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const result = validateImage(buffer, 'image/jpeg');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG image', () => {
      const buffer = Buffer.alloc(1024 * 1024); // 1MB
      const result = validateImage(buffer, 'image/png');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WebP image', () => {
      const buffer = Buffer.alloc(1024 * 1024); // 1MB
      const result = validateImage(buffer, 'image/webp');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject image larger than 10MB', () => {
      const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const result = validateImage(buffer, 'image/jpeg');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds 10MB limit');
    });

    it('should reject unsupported image type', () => {
      const buffer = Buffer.alloc(1024 * 1024); // 1MB
      const result = validateImage(buffer, 'image/gif');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject image at exactly 10MB + 1 byte', () => {
      const buffer = Buffer.alloc(sharpConfig.validation.maxFileSizeBytes + 1);
      const result = validateImage(buffer, 'image/jpeg');
      
      expect(result.valid).toBe(false);
    });

    it('should accept image at exactly 10MB', () => {
      const buffer = Buffer.alloc(sharpConfig.validation.maxFileSizeBytes);
      const result = validateImage(buffer, 'image/jpeg');
      
      expect(result.valid).toBe(true);
    });
  });

  describe('generateImageFileNames', () => {
    it('should generate correct file names with property and image IDs', () => {
      const result = generateImageFileNames('prop-123', 'img-456');
      
      expect(result.fullName).toBe('prop-123/img-456_full.jpg');
      expect(result.thumbName).toBe('prop-123/img-456_thumb.jpg');
    });

    it('should handle UUID-style IDs', () => {
      const propertyId = '550e8400-e29b-41d4-a716-446655440000';
      const imageId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const result = generateImageFileNames(propertyId, imageId);
      
      expect(result.fullName).toBe(`${propertyId}/${imageId}_full.jpg`);
      expect(result.thumbName).toBe(`${propertyId}/${imageId}_thumb.jpg`);
    });

    it('should follow naming convention from config', () => {
      const result = generateImageFileNames('test-prop', 'test-img');
      
      expect(result.fullName).toContain(sharpConfig.naming.fullSuffix);
      expect(result.thumbName).toContain(sharpConfig.naming.thumbSuffix);
    });
  });

  // Note: The following tests for compressFullSize, generateThumbnail, and getImageMetadata
  // would require actual image buffers to test properly. These are integration-level tests
  // that should be implemented when the imageCompressionService is created.
  // For now, we verify the functions exist and have correct signatures.

  describe('function signatures', () => {
    it('should export compressFullSize function', () => {
      expect(typeof compressFullSize).toBe('function');
    });

    it('should export generateThumbnail function', () => {
      expect(typeof generateThumbnail).toBe('function');
    });

    it('should export getImageMetadata function', () => {
      expect(typeof getImageMetadata).toBe('function');
    });
  });
});
