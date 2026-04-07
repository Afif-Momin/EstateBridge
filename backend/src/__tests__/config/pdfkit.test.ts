/**
 * PDFKit Configuration Tests
 * 
 * Tests to verify PDFKit and QRCode packages are properly installed and configured.
 */

import PDFDocument = require('pdfkit');
import QRCode from 'qrcode';
import {
  DEFAULT_PDF_OPTIONS,
  BRANDING,
  LAYOUT,
  FONTS,
  QR_CODE_DATAURL_OPTIONS,
  createPDFDocument,
} from '../../config/pdfkit';

describe('PDFKit Configuration', () => {
  describe('Package Installation', () => {
    it('should import PDFDocument successfully', () => {
      expect(PDFDocument).toBeDefined();
      expect(typeof PDFDocument).toBe('function');
    });

    it('should import QRCode successfully', () => {
      expect(QRCode).toBeDefined();
      expect(typeof QRCode.toDataURL).toBe('function');
    });
  });

  describe('Configuration Constants', () => {
    it('should have valid DEFAULT_PDF_OPTIONS', () => {
      expect(DEFAULT_PDF_OPTIONS).toBeDefined();
      expect(DEFAULT_PDF_OPTIONS.size).toBe('A4');
      expect(DEFAULT_PDF_OPTIONS.margins).toEqual({
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      });
      expect(DEFAULT_PDF_OPTIONS.info?.Title).toBe('Property Brochure');
      expect(DEFAULT_PDF_OPTIONS.info?.Author).toBe('Estate Bridge');
    });

    it('should have valid BRANDING configuration', () => {
      expect(BRANDING).toBeDefined();
      expect(BRANDING.companyName).toBe('Estate Bridge');
      expect(BRANDING.tagline).toBe('Your Trusted Real Estate Partner');
      expect(BRANDING.website).toBe('www.estatebridge.com');
      expect(BRANDING.primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(BRANDING.secondaryColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(BRANDING.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should have valid LAYOUT configuration', () => {
      expect(LAYOUT).toBeDefined();
      expect(LAYOUT.maxImagesPerPage).toBe(3);
      expect(LAYOUT.imageWidth).toBe(500);
      expect(LAYOUT.imageHeight).toBe(300);
      expect(LAYOUT.qrCodeSize).toBe(100);
      expect(LAYOUT.headerHeight).toBe(80);
      expect(LAYOUT.footerHeight).toBe(50);
      expect(LAYOUT.sectionSpacing).toBe(20);
      expect(LAYOUT.lineHeight).toBe(1.5);
    });

    it('should have valid FONTS configuration', () => {
      expect(FONTS).toBeDefined();
      expect(FONTS.heading.size).toBe(24);
      expect(FONTS.heading.font).toBe('Helvetica-Bold');
      expect(FONTS.subheading.size).toBe(18);
      expect(FONTS.body.size).toBe(12);
      expect(FONTS.small.size).toBe(10);
      expect(FONTS.footer.size).toBe(9);
    });

    it('should have valid QR_CODE_DATAURL_OPTIONS', () => {
      expect(QR_CODE_DATAURL_OPTIONS).toBeDefined();
      expect(QR_CODE_DATAURL_OPTIONS.errorCorrectionLevel).toBe('M');
      expect(QR_CODE_DATAURL_OPTIONS.type).toBe('image/png');
      expect(QR_CODE_DATAURL_OPTIONS.quality).toBe(0.92);
      expect(QR_CODE_DATAURL_OPTIONS.margin).toBe(1);
      expect(QR_CODE_DATAURL_OPTIONS.width).toBe(100);
    });
  });

  describe('createPDFDocument', () => {
    it('should create a PDF document with default options', () => {
      const doc = createPDFDocument();
      expect(doc).toBeDefined();
      expect(doc).toBeInstanceOf(PDFDocument);
    });

    it('should create a PDF document with custom options', () => {
      const customOptions = {
        size: 'LETTER' as const,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      };
      const doc = createPDFDocument(customOptions);
      expect(doc).toBeDefined();
      expect(doc).toBeInstanceOf(PDFDocument);
    });

    it('should merge custom options with defaults', () => {
      const customOptions = {
        info: {
          Title: 'Custom Title',
        },
      };
      const doc = createPDFDocument(customOptions);
      expect(doc).toBeDefined();
    });
  });

  describe('QRCode Generation', () => {
    it('should generate QR code data URL', async () => {
      const testUrl = 'https://estatebridge.com/property/123';
      const dataUrl = await QRCode.toDataURL(testUrl, QR_CODE_DATAURL_OPTIONS);
      
      expect(dataUrl).toBeDefined();
      expect(typeof dataUrl).toBe('string');
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate QR code with custom options', async () => {
      const testUrl = 'https://estatebridge.com/property/456';
      const customOptions = {
        ...QR_CODE_DATAURL_OPTIONS,
        width: 200,
      };
      const dataUrl = await QRCode.toDataURL(testUrl, customOptions);
      
      expect(dataUrl).toBeDefined();
      expect(typeof dataUrl).toBe('string');
    });

    it('should handle invalid URLs gracefully', async () => {
      const invalidUrl = '';
      await expect(QRCode.toDataURL(invalidUrl, QR_CODE_DATAURL_OPTIONS)).rejects.toThrow();
    });
  });

  describe('PDF Document Creation', () => {
    it('should create a document that can accept text', () => {
      const doc = createPDFDocument();
      
      // Should not throw when adding text
      expect(() => {
        doc.fontSize(FONTS.heading.size)
           .font(FONTS.heading.font)
           .text('Test Heading');
      }).not.toThrow();
      
      doc.end();
    });

    it('should create a document with proper page size', () => {
      const doc = createPDFDocument();
      expect(doc).toBeDefined();
      doc.end();
    });
  });

  describe('Configuration Validation', () => {
    it('should have consistent QR code size in LAYOUT and QR_CODE_DATAURL_OPTIONS', () => {
      expect(LAYOUT.qrCodeSize).toBe(QR_CODE_DATAURL_OPTIONS.width);
    });

    it('should have reasonable image dimensions', () => {
      expect(LAYOUT.imageWidth).toBeGreaterThan(0);
      expect(LAYOUT.imageHeight).toBeGreaterThan(0);
      expect(LAYOUT.imageWidth).toBeGreaterThan(LAYOUT.imageHeight);
    });

    it('should have reasonable font sizes', () => {
      expect(FONTS.heading.size).toBeGreaterThan(FONTS.subheading.size);
      expect(FONTS.subheading.size).toBeGreaterThan(FONTS.body.size);
      expect(FONTS.body.size).toBeGreaterThan(FONTS.small.size);
      expect(FONTS.small.size).toBeGreaterThan(FONTS.footer.size);
    });

    it('should have positive layout dimensions', () => {
      expect(LAYOUT.maxImagesPerPage).toBeGreaterThan(0);
      expect(LAYOUT.headerHeight).toBeGreaterThan(0);
      expect(LAYOUT.footerHeight).toBeGreaterThan(0);
      expect(LAYOUT.sectionSpacing).toBeGreaterThan(0);
      expect(LAYOUT.lineHeight).toBeGreaterThan(1);
    });
  });
});
