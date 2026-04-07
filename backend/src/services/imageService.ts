import { getFirebaseStorage } from '../config/firebase';
import { ValidationError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import * as path from 'path';
import { randomUUID } from 'crypto';

/**
 * Image Service
 * Handles Firebase Storage operations for property images
 */

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Constraints
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGES_PER_PROPERTY = 10;

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/**
 * Validate a single image file
 */
export function validateImageFile(file: UploadFile): void {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`
    );
  }

  // Validate extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ValidationError(
      `Invalid file extension: ${ext}. Only .jpg, .jpeg, .png, and .webp are allowed.`
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size ${file.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES} bytes (5MB).`
    );
  }
}

class ImageService {
  private readonly storagePath = 'properties';

  /**
   * Upload multiple images for a property
   * Returns array of public download URLs
   */
  async uploadImages(propertyId: string, files: UploadFile[]): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    if (files.length > MAX_IMAGES_PER_PROPERTY) {
      throw new ValidationError(
        `Cannot upload more than ${MAX_IMAGES_PER_PROPERTY} images per property.`
      );
    }

    // Validate all files before uploading any
    for (const file of files) {
      validateImageFile(file);
    }

    const storage = getFirebaseStorage();
    const bucket = storage.bucket();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${randomUUID()}${ext}`;
      const filePath = `${this.storagePath}/${propertyId}/${filename}`;

      const fileRef = bucket.file(filePath);

      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            propertyId,
            originalName: file.originalname,
          },
        },
      });

      // Make the file publicly accessible
      await fileRef.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      uploadedUrls.push(publicUrl);

      logWithContext('info', 'Image uploaded', { propertyId, filePath });
    }

    return uploadedUrls;
  }

  /**
   * Delete a single image by its public URL
   */
  async deleteImage(propertyId: string, imageUrl: string): Promise<void> {
    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(imageUrl, bucket.name);

      if (!filePath) {
        logWithContext('warn', 'Could not extract file path from URL', { imageUrl });
        return;
      }

      // Verify the file belongs to this property
      if (!filePath.startsWith(`${this.storagePath}/${propertyId}/`)) {
        throw new ValidationError('Image does not belong to this property');
      }

      await bucket.file(filePath).delete();

      logWithContext('info', 'Image deleted', { propertyId, filePath });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      // If file doesn't exist, log and continue
      logWithContext('warn', 'Error deleting image (may not exist)', { imageUrl, error });
    }
  }

  /**
   * Delete all images for a property
   */
  async deletePropertyImages(propertyId: string): Promise<void> {
    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      const prefix = `${this.storagePath}/${propertyId}/`;

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
      // Log but don't throw — property deletion should still succeed
      logWithContext('error', 'Error deleting property images', { propertyId, error });
    }
  }

  /**
   * Extract the GCS file path from a public URL
   */
  private extractFilePathFromUrl(url: string, bucketName: string): string | null {
    try {
      const prefix = `https://storage.googleapis.com/${bucketName}/`;
      if (!url.startsWith(prefix)) {
        return null;
      }
      return decodeURIComponent(url.slice(prefix.length));
    } catch {
      return null;
    }
  }
}

export default new ImageService();
