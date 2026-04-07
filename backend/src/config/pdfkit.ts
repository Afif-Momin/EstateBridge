/**
 * PDFKit Configuration
 * 
 * Configuration for PDF document generation using PDFKit library.
 * Used for generating property brochures with images, details, and QR codes.
 */

import PDFDocument = require('pdfkit');

/**
 * Default PDF document options for property brochures
 */
export const DEFAULT_PDF_OPTIONS: PDFKit.PDFDocumentOptions = {
  size: 'A4',
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  },
  info: {
    Title: 'Property Brochure',
    Author: 'Estate Bridge',
    Subject: 'Real Estate Property Details',
    Creator: 'Estate Bridge Platform',
  },
  autoFirstPage: true,
  bufferPages: true,
};

/**
 * Branding configuration for PDF documents
 */
export const BRANDING = {
  companyName: 'Estate Bridge',
  tagline: 'Your Trusted Real Estate Partner',
  website: 'www.estatebridge.com',
  primaryColor: '#2563eb', // Blue
  secondaryColor: '#64748b', // Gray
  accentColor: '#10b981', // Green
};

/**
 * Layout configuration for brochure content
 */
export const LAYOUT = {
  maxImagesPerPage: 3,
  imageWidth: 500,
  imageHeight: 300,
  qrCodeSize: 100,
  headerHeight: 80,
  footerHeight: 50,
  sectionSpacing: 20,
  lineHeight: 1.5,
};

/**
 * Font configuration
 */
export const FONTS = {
  heading: {
    size: 24,
    font: 'Helvetica-Bold',
  },
  subheading: {
    size: 18,
    font: 'Helvetica-Bold',
  },
  body: {
    size: 12,
    font: 'Helvetica',
  },
  small: {
    size: 10,
    font: 'Helvetica',
  },
  footer: {
    size: 9,
    font: 'Helvetica',
  },
};

/**
 * Create a new PDF document with default configuration
 */
export const createPDFDocument = (options?: Partial<PDFKit.PDFDocumentOptions>): PDFKit.PDFDocument => {
  return new PDFDocument({
    ...DEFAULT_PDF_OPTIONS,
    ...options,
  });
};

/**
 * QR Code generation options for buffer output (used in PDF generation)
 */
export const QR_CODE_BUFFER_OPTIONS = {
  errorCorrectionLevel: 'M' as const,
  type: 'png' as const,
  quality: 0.92,
  margin: 1,
  width: LAYOUT.qrCodeSize,
};

/**
 * QR Code generation options for data URL output (used in tests)
 */
export const QR_CODE_DATAURL_OPTIONS = {
  errorCorrectionLevel: 'M' as const,
  type: 'image/png' as const,
  quality: 0.92,
  margin: 1,
  width: LAYOUT.qrCodeSize,
};

/**
 * @deprecated Use QR_CODE_BUFFER_OPTIONS or QR_CODE_DATAURL_OPTIONS instead
 */
export const QR_CODE_OPTIONS = QR_CODE_BUFFER_OPTIONS;
