/**
 * Tests for Sharp configuration
 * Validates that Sharp is properly configured according to requirements
 */

import { sharpConfig } from '../../config/sharp';

describe('Sharp Configuration', () => {
  describe('JPEG compression settings', () => {
    it('should have quality set to 85%', () => {
      expect(sharpConfig.jpeg.quality).toBe(85);
    });

    it('should enable progressive JPEG', () => {
      expect(sharpConfig.jpeg.progressive).toBe(true);
    });

    it('should enable mozjpeg compression', () => {
      expect(sharpConfig.jpeg.mozjpeg).toBe(true);
    });
  });

  describe('Full-size image settings', () => {
    it('should have max width of 1920px', () => {
      expect(sharpConfig.fullSize.maxWidth).toBe(1920);
    });

    it('should maintain aspect ratio with "inside" fit', () => {
      expect(sharpConfig.fullSize.fit).toBe('inside');
    });

    it('should not enlarge smaller images', () => {
      expect(sharpConfig.fullSize.withoutEnlargement).toBe(true);
    });
  });

  describe('Thumbnail settings', () => {
    it('should have width of 400px', () => {
      expect(sharpConfig.thumbnail.width).toBe(400);
    });

    it('should maintain aspect ratio with "inside" fit', () => {
      expect(sharpConfig.thumbnail.fit).toBe('inside');
    });

    it('should not enlarge smaller images', () => {
      expect(sharpConfig.thumbnail.withoutEnlargement).toBe(true);
    });
  });

  describe('Validation settings', () => {
    it('should have max file size of 10MB', () => {
      expect(sharpConfig.validation.maxFileSizeBytes).toBe(10 * 1024 * 1024);
    });

    it('should allow JPEG, PNG, and WebP formats', () => {
      expect(sharpConfig.validation.allowedMimeTypes).toContain('image/jpeg');
      expect(sharpConfig.validation.allowedMimeTypes).toContain('image/jpg');
      expect(sharpConfig.validation.allowedMimeTypes).toContain('image/png');
      expect(sharpConfig.validation.allowedMimeTypes).toContain('image/webp');
    });
  });

  describe('Naming convention', () => {
    it('should use _full.jpg suffix for full-size images', () => {
      expect(sharpConfig.naming.fullSuffix).toBe('_full.jpg');
    });

    it('should use _thumb.jpg suffix for thumbnails', () => {
      expect(sharpConfig.naming.thumbSuffix).toBe('_thumb.jpg');
    });
  });
});
