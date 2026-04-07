/**
 * Image Compression Service
 * 
 * Handles image validation, compression, and upload to Firebase Storage.
 * Implements requirements 13.1-13.5 for image optimization.
 */

import { getFirebaseStorage } from '../config/firebase';
import {
  validateImage as validateImageBuffer,
  compressFullSize,
  generateThumbnail,
  generateImageFileNames,
} from '../utils/imageProcessor';
import { ValidationError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageUploadResult {
  fullUrl: string;
  thumbnailUrl: string;
}

class ImageCompressionService {
  /**
   * Validates image file size and format
   * Requirement 13.4: Maximum 10MB file size before compression
   * 
   * @param file - Image file buffer
   * @param mimeType - MIME type of the image
   * @returns Validation result with error message if invalid
   */
  validateImage(file: Buffer, mimeType: string): ImageValidationResult {
    return validateImageBuffer(file, mimeType);
  }

  /**
   * Compresses image and uploads both full-size and thumbnail versions to Firebase Storage
   * 
   * Requirements:
   * - 13.1: Compress to max 1920px width, maintain aspect ratio
   * - 13.2: 85% JPEG compression quality
   * - 13.3: Generate thumbnail at 400px width
   * - 13.5: Naming pattern {propertyId}/{imageId}_full.jpg and {propertyId}/{imageId}_thumb.jpg
   * 
   * @param file - Original image buffer
   * @param propertyId - Property ID for storage path
   * @param imageId - Unique image identifier
   * @returns URLs for both full-size and thumbnail versions
   */
  async compressAndUpload(
    file: Buffer,
    propertyId: string,
    imageId: string
  ): Promise<ImageUploadResult> {
    try {
      logWithContext('info', 'Starting image compression and upload', {
        propertyId,
        imageId,
        originalSize: file.length,
      });

      // Compress to full-size version (max 1920px width)
      const fullSizeBuffer = await compressFullSize(file);
      
      // Generate thumbnail (400px width)
      const thumbnailBuffer = await generateThumbnail(file);

      logWithContext('info', 'Image compression completed', {
        propertyId,
        imageId,
        originalSize: file.length,
        fullSizeCompressed: fullSizeBuffer.length,
        thumbnailSize: thumbnailBuffer.length,
        compressionRatio: ((1 - fullSizeBuffer.length / file.length) * 100).toFixed(2) + '%',
      });

      // Generate file names
      const { fullName, thumbName } = generateImageFileNames(propertyId, imageId);

      // Upload both versions to Firebase Storage
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();

      // Upload full-size image
      const fullFileRef = bucket.file(fullName);
      await fullFileRef.save(fullSizeBuffer, {
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
      await fullFileRef.makePublic();

      // Upload thumbnail
      const thumbFileRef = bucket.file(thumbName);
      await thumbFileRef.save(thumbnailBuffer, {
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
      await thumbFileRef.makePublic();

      // Generate public URLs
      const fullUrl = `https://storage.googleapis.com/${bucket.name}/${fullName}`;
      const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbName}`;

      logWithContext('info', 'Image upload completed', {
        propertyId,
        imageId,
        fullUrl,
        thumbnailUrl,
      });

      return {
        fullUrl,
        thumbnailUrl,
      };
    } catch (error) {
      logWithContext('error', 'Image compression and upload failed', {
        propertyId,
        imageId,
        error,
      });
      throw new ValidationError(
        `Failed to compress and upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete both full-size and thumbnail versions of an image
   * 
   * @param propertyId - Property ID
   * @param imageId - Image ID
   */
  async deleteImage(propertyId: string, imageId: string): Promise<void> {
    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      const { fullName, thumbName } = generateImageFileNames(propertyId, imageId);

      // Delete both versions
      await Promise.all([
        bucket.file(fullName).delete().catch(() => {
          logWithContext('warn', 'Full-size image not found for deletion', { propertyId, imageId });
        }),
        bucket.file(thumbName).delete().catch(() => {
          logWithContext('warn', 'Thumbnail image not found for deletion', { propertyId, imageId });
        }),
      ]);

      logWithContext('info', 'Image deleted', { propertyId, imageId });
    } catch (error) {
      logWithContext('error', 'Error deleting image', { propertyId, imageId, error });
      // Don't throw - deletion failures shouldn't block other operations
    }
  }

  /**
   * Delete all images for a property
   * 
   * @param propertyId - Property ID
   */
  async deletePropertyImages(propertyId: string): Promise<void> {
    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      const prefix = `${propertyId}/`;

      const [files] = await bucket.getFiles({ prefix });

      if (files.length === 0) {
        logWithContext('info', 'No images to delete for property', { propertyId });
        return;
      }

      await Promise.all(files.map((file) => file.delete()));

      logWithContext('info', 'All property images deleted', {
        propertyId,
        count: files.length,
      });
    } catch (error) {
      logWithContext('error', 'Error deleting property images', { propertyId, error });
      // Don't throw - deletion failures shouldn't block property deletion
    }
  }
}

export default new ImageCompressionService();
