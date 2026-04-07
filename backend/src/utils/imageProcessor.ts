/**
 * Image Processing Utility
 * 
 * Provides helper functions for image compression and optimization using Sharp.
 * This is a utility module that will be used by the imageCompressionService.
 */

import sharp from 'sharp';
import { sharpConfig } from '../config/sharp';

/**
 * Validates image file size and type
 * 
 * @param buffer - Image buffer to validate
 * @param mimeType - MIME type of the image
 * @returns Validation result with error message if invalid
 */
export const validateImage = (
  buffer: Buffer,
  mimeType: string
): { valid: boolean; error?: string } => {
  // Check file size
  if (buffer.length > sharpConfig.validation.maxFileSizeBytes) {
    return {
      valid: false,
      error: `Image size exceeds ${sharpConfig.validation.maxFileSizeBytes / (1024 * 1024)}MB limit`,
    };
  }

  // Check MIME type
  const allowedTypes = sharpConfig.validation.allowedMimeTypes as readonly string[];
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Image type ${mimeType} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Compresses image to full-size version
 * 
 * @param buffer - Original image buffer
 * @returns Compressed image buffer
 */
export const compressFullSize = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize({
      width: sharpConfig.fullSize.maxWidth,
      fit: sharpConfig.fullSize.fit,
      withoutEnlargement: sharpConfig.fullSize.withoutEnlargement,
    })
    .jpeg(sharpConfig.jpeg)
    .toBuffer();
};

/**
 * Generates thumbnail version of image
 * 
 * @param buffer - Original image buffer
 * @returns Thumbnail image buffer
 */
export const generateThumbnail = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize({
      width: sharpConfig.thumbnail.width,
      fit: sharpConfig.thumbnail.fit,
      withoutEnlargement: sharpConfig.thumbnail.withoutEnlargement,
    })
    .jpeg(sharpConfig.jpeg)
    .toBuffer();
};

/**
 * Gets image metadata
 * 
 * @param buffer - Image buffer
 * @returns Image metadata including dimensions and format
 */
export const getImageMetadata = async (buffer: Buffer) => {
  return sharp(buffer).metadata();
};

/**
 * Generates storage file names for full-size and thumbnail images
 * 
 * @param propertyId - Property ID
 * @param imageId - Image ID
 * @returns Object with full and thumbnail file names
 */
export const generateImageFileNames = (
  propertyId: string,
  imageId: string
): { fullName: string; thumbName: string } => {
  return {
    fullName: `${propertyId}/${imageId}${sharpConfig.naming.fullSuffix}`,
    thumbName: `${propertyId}/${imageId}${sharpConfig.naming.thumbSuffix}`,
  };
};
