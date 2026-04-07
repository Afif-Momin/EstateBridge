# Sharp Image Processing Configuration

## Overview

This document describes the Sharp library configuration for the Estate Bridge platform. Sharp is used for high-performance image compression and optimization to reduce storage costs and improve page load times.

## Installation

Sharp has been installed as a production dependency:

```bash
npm install sharp
npm install --save-dev @types/sharp
```

**Version:** sharp@0.34.5

## Configuration

The Sharp configuration is defined in `src/config/sharp.ts` and includes the following settings:

### JPEG Compression (Requirement 13.2)

- **Quality:** 85% - Optimal balance between file size and image quality
- **Progressive:** Enabled - Images load progressively for better UX
- **MozJPEG:** Enabled - Uses MozJPEG encoder for better compression

### Full-Size Images (Requirement 13.1)

- **Max Width:** 1920px - Images are resized to maximum 1920px width
- **Fit Mode:** 'inside' - Maintains aspect ratio
- **Without Enlargement:** true - Smaller images are not upscaled

### Thumbnails (Requirement 13.3)

- **Width:** 400px - Thumbnail width for property cards
- **Fit Mode:** 'inside' - Maintains aspect ratio
- **Without Enlargement:** true - Smaller images are not upscaled

### Validation (Requirement 13.4)

- **Max File Size:** 10MB - Images larger than 10MB are rejected before compression
- **Allowed MIME Types:**
  - image/jpeg
  - image/jpg
  - image/png
  - image/webp

### Naming Convention (Requirement 13.5)

- **Full-Size:** `{property_id}/{image_id}_full.jpg`
- **Thumbnail:** `{property_id}/{image_id}_thumb.jpg`

## Usage

### Import Configuration

```typescript
import { sharpConfig } from '../config/sharp';
```

### Using Image Processor Utilities

The `src/utils/imageProcessor.ts` module provides helper functions:

```typescript
import {
  validateImage,
  compressFullSize,
  generateThumbnail,
  getImageMetadata,
  generateImageFileNames,
} from '../utils/imageProcessor';

// Validate image
const validation = validateImage(buffer, 'image/jpeg');
if (!validation.valid) {
  throw new Error(validation.error);
}

// Compress to full-size
const fullSizeBuffer = await compressFullSize(buffer);

// Generate thumbnail
const thumbnailBuffer = await generateThumbnail(buffer);

// Get image metadata
const metadata = await getImageMetadata(buffer);

// Generate file names
const { fullName, thumbName } = generateImageFileNames('prop-123', 'img-456');
```

## Testing

Configuration tests are located in:
- `src/__tests__/config/sharp.test.ts` - Configuration validation
- `src/__tests__/utils/imageProcessor.test.ts` - Utility function tests

Run tests:
```bash
npm test -- src/__tests__/config/sharp.test.ts
npm test -- src/__tests__/utils/imageProcessor.test.ts
```

## Next Steps

The following components will use this configuration:

1. **Image Compression Service** (Task 11.2) - Service layer for image processing
2. **Property Image Upload** (Task 11.3) - Integration with property creation
3. **Firebase Storage Integration** (Task 11.4) - Upload compressed images to storage

## Requirements Mapping

- **Requirement 13.1:** Maximum 1920px width ✓
- **Requirement 13.2:** 85% JPEG compression quality ✓
- **Requirement 13.3:** 400px thumbnail generation ✓
- **Requirement 13.4:** 10MB file size limit ✓
- **Requirement 13.5:** Naming convention {property_id}/{image_id}_full.jpg ✓

## Performance Considerations

- Sharp is a native Node.js module that uses libvips for fast image processing
- Compression is performed asynchronously to avoid blocking the event loop
- Images are processed in memory for optimal performance
- Progressive JPEG encoding improves perceived load time

## Troubleshooting

### Installation Issues

If Sharp fails to install, try:
```bash
npm rebuild sharp
```

### Platform-Specific Builds

Sharp includes pre-built binaries for common platforms. If you encounter issues:
```bash
npm install --platform=linux --arch=x64 sharp
```

## References

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Sharp GitHub Repository](https://github.com/lovell/sharp)
- Platform Enhancements Design Document: `.kiro/specs/platform-enhancements/design.md`
- Platform Enhancements Requirements: `.kiro/specs/platform-enhancements/requirements.md`
