/**
 * Sharp Image Processing Configuration
 * 
 * Configuration for image compression and optimization using Sharp library.
 * Used for property image uploads to reduce storage costs and improve performance.
 */

export const sharpConfig = {
  /**
   * JPEG compression quality (0-100)
   * Requirement 13.2: 85% quality for optimal balance between size and quality
   */
  jpeg: {
    quality: 85,
    progressive: true,
    mozjpeg: true, // Use mozjpeg for better compression
  },

  /**
   * Full-size image dimensions
   * Requirement 13.1: Maximum 1920px width while maintaining aspect ratio
   */
  fullSize: {
    maxWidth: 1920,
    fit: 'inside' as const, // Maintain aspect ratio
    withoutEnlargement: true, // Don't upscale smaller images
  },

  /**
   * Thumbnail dimensions
   * Requirement 13.3: 400px width for property cards
   */
  thumbnail: {
    width: 400,
    fit: 'inside' as const,
    withoutEnlargement: true,
  },

  /**
   * Image validation limits
   * Requirement 13.4: Maximum 10MB file size before compression
   */
  validation: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },

  /**
   * Storage naming convention
   * Requirement 13.5: {property_id}/{image_id}_full.jpg and {property_id}/{image_id}_thumb.jpg
   */
  naming: {
    fullSuffix: '_full.jpg',
    thumbSuffix: '_thumb.jpg',
  },
} as const;

export type SharpConfig = typeof sharpConfig;
