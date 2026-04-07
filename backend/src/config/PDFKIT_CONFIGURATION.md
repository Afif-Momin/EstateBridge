# PDFKit Configuration Documentation

## Overview

This document describes the PDFKit configuration for generating property brochures in the Estate Bridge platform.

## Installed Packages

### Production Dependencies

- **pdfkit** (^0.18.0): PDF document generation library
  - Used for creating professional property brochures
  - Supports text, images, vector graphics, and custom layouts
  - Generates PDFs in-memory for upload to Firebase Storage

- **qrcode** (^1.5.4): QR code generation library
  - Used to generate QR codes linking to property detail pages
  - Supports various output formats (PNG, SVG, data URL)
  - Configurable error correction and size

### Development Dependencies

- **@types/pdfkit** (^0.17.5): TypeScript type definitions for PDFKit
- **@types/qrcode** (^1.5.6): TypeScript type definitions for qrcode

## Configuration File

The configuration is located at `backend/src/config/pdfkit.ts` and includes:

### 1. Default PDF Options

```typescript
{
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Property Brochure',
    Author: 'Estate Bridge',
    Subject: 'Real Estate Property Details',
    Creator: 'Estate Bridge Platform',
  },
  autoFirstPage: true,
  bufferPages: true,
}
```

### 2. Branding Configuration

- **Company Name**: Estate Bridge
- **Tagline**: Your Trusted Real Estate Partner
- **Website**: www.estatebridge.com
- **Colors**:
  - Primary: #2563eb (Blue)
  - Secondary: #64748b (Gray)
  - Accent: #10b981 (Green)

### 3. Layout Configuration

- **Max Images Per Page**: 3
- **Image Dimensions**: 500x300 pixels
- **QR Code Size**: 100x100 pixels
- **Header Height**: 80 pixels
- **Footer Height**: 50 pixels
- **Section Spacing**: 20 pixels
- **Line Height**: 1.5

### 4. Font Configuration

- **Heading**: Helvetica-Bold, 24pt
- **Subheading**: Helvetica-Bold, 18pt
- **Body**: Helvetica, 12pt
- **Small**: Helvetica, 10pt
- **Footer**: Helvetica, 9pt

### 5. QR Code Options

- **Error Correction Level**: M (Medium - 15% recovery)
- **Type**: image/png
- **Quality**: 0.92
- **Margin**: 1
- **Width**: 100 pixels

## Usage

### Creating a PDF Document

```typescript
import { createPDFDocument } from '../config/pdfkit';

const doc = createPDFDocument();
```

### Using Configuration Constants

```typescript
import { BRANDING, LAYOUT, FONTS, QR_CODE_OPTIONS } from '../config/pdfkit';

// Add header with branding
doc.fontSize(FONTS.heading.size)
   .font(FONTS.heading.font)
   .fillColor(BRANDING.primaryColor)
   .text(BRANDING.companyName);

// Add images with layout constraints
const imagesPerPage = LAYOUT.maxImagesPerPage;
```

### Generating QR Codes

```typescript
import QRCode from 'qrcode';
import { QR_CODE_OPTIONS } from '../config/pdfkit';

const qrCodeDataUrl = await QRCode.toDataURL(propertyUrl, QR_CODE_OPTIONS);
```

## Brochure Generation Flow

1. **Fetch Property Data**: Retrieve property details, images, and seller information
2. **Create PDF Document**: Initialize PDFKit document with default options
3. **Add Header**: Include Estate Bridge branding and logo
4. **Add Property Images**: Display up to 3 images per page
5. **Add Property Details**: Include type, price, location, description
6. **Add Features**: List bedrooms, bathrooms, amenities, etc.
7. **Add Seller Contact**: Include name, email, phone
8. **Add QR Code**: Generate and embed QR code linking to property page
9. **Add Footer**: Include company information and page numbers
10. **Upload to Storage**: Save PDF to Firebase Storage
11. **Generate Signed URL**: Create temporary download link (1 hour expiry)

## Requirements Validation

This configuration supports the following requirements:

- **Requirement 8.1**: Property brochure generation with images, details, features, location, and price
- **Requirement 8.2**: Estate Bridge branding in header and footer
- **Requirement 8.3**: Professional styling and layout
- **Requirement 17.5**: QR code linking to property detail page

## Next Steps

The next task (14.2) will create the Brochure model, followed by task 14.3 which will implement the BrochureGeneratorService using this configuration.

## References

- [PDFKit Documentation](http://pdfkit.org/)
- [QRCode Documentation](https://github.com/soldair/node-qrcode)
- [Estate Bridge Design Document](.kiro/specs/platform-enhancements/design.md)
