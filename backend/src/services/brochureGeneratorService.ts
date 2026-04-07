/**
 * Brochure Generator Service
 * 
 * Generates professional PDF brochures for property listings with:
 * - Estate Bridge branding
 * - Property images (max 3 per page)
 * - Property details (type, price, location, description)
 * - Property features
 * - Seller contact information
 * - QR code linking to property detail page
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 17.1, 17.2, 17.3, 17.4, 17.5
 */

import { createPDFDocument, BRANDING, LAYOUT, FONTS, QR_CODE_BUFFER_OPTIONS } from '../config/pdfkit';
import { getFirebaseFirestore, getFirebaseStorage } from '../config/firebase';
import { Property, User } from '../types';
import { NotFoundError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { formatPrice } from './currencyService';
import * as QRCode from 'qrcode';
import { Readable } from 'stream';

/**
 * Brochure generation result
 */
interface BrochureResult {
  downloadUrl: string;
  expiresAt: Date;
  fileName: string;
}

/**
 * Property data with seller information for brochure
 */
interface PropertyWithSeller extends Property {
  seller: User;
}

class BrochureGeneratorService {
  private readonly FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  private readonly EXPIRATION_HOURS = 1;

  /**
   * Generate a PDF brochure for a property
   * 
   * @param propertyId - Property ID to generate brochure for
   * @param userId - User ID requesting the brochure
   * @returns Download URL, expiration time, and filename
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 17.1, 17.2, 17.3, 17.4, 17.5
   */
  async generateBrochure(propertyId: string, userId: string): Promise<BrochureResult> {
    try {
      logWithContext('info', 'Starting brochure generation', { propertyId, userId });

      // Fetch property data with seller information
      const property = await this.fetchPropertyWithSeller(propertyId);

      // Create PDF document
      const doc = createPDFDocument();
      const chunks: Buffer[] = [];

      // Collect PDF data
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      // Generate PDF content
      await this.generatePDFContent(doc, property);

      // Finalize PDF
      doc.end();

      // Wait for PDF generation to complete
      await new Promise<void>((resolve, reject) => {
        doc.on('end', () => resolve());
        doc.on('error', (error: Error) => reject(error));
      });

      // Combine chunks into single buffer
      const pdfBuffer = Buffer.concat(chunks);

      // Upload to Firebase Storage
      const result = await this.uploadToStorage(pdfBuffer, propertyId);

      logWithContext('info', 'Brochure generated successfully', {
        propertyId,
        userId,
        fileName: result.fileName,
      });

      return result;
    } catch (error) {
      logWithContext('error', 'Error generating brochure', { error, propertyId, userId });
      throw error;
    }
  }

  /**
   * Fetch property data with seller information
   */
  private async fetchPropertyWithSeller(propertyId: string): Promise<PropertyWithSeller> {
    const db = getFirebaseFirestore();

    // Fetch property
    const propertyDoc = await db.collection('properties').doc(propertyId).get();

    if (!propertyDoc.exists) {
      throw new NotFoundError('Property not found');
    }

    const propertyData = propertyDoc.data() as Property;

    // Fetch seller information
    const sellerDoc = await db.collection('users').doc(propertyData.sellerId).get();

    if (!sellerDoc.exists) {
      throw new NotFoundError('Seller information not found');
    }

    const sellerData = sellerDoc.data() as User;

    return {
      ...propertyData,
      id: propertyDoc.id,
      seller: {
        ...sellerData,
        id: sellerDoc.id,
      },
    };
  }

  /**
   * Generate PDF content with all sections
   */
  private async generatePDFContent(doc: PDFKit.PDFDocument, property: PropertyWithSeller): Promise<void> {
    // Add header with branding
    this.addHeader(doc);

    // Add property title
    this.addPropertyTitle(doc, property);

    // Add property images
    await this.addPropertyImages(doc, property);

    // Add property details
    this.addPropertyDetails(doc, property);

    // Add property features (if available)
    this.addPropertyFeatures(doc, property);

    // Add seller contact information
    this.addSellerContact(doc, property.seller);

    // Add QR code
    await this.addQRCode(doc, property.id);

    // Add footer with branding
    this.addFooter(doc);
  }

  /**
   * Add header with Estate Bridge branding
   * Requirement: 8.2
   */
  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(FONTS.heading.size)
      .font(FONTS.heading.font)
      .fillColor(BRANDING.primaryColor)
      .text(BRANDING.companyName, 50, 50, { align: 'center' });

    doc
      .fontSize(FONTS.small.size)
      .font(FONTS.small.font)
      .fillColor(BRANDING.secondaryColor)
      .text(BRANDING.tagline, 50, 80, { align: 'center' });

    // Add horizontal line
    doc
      .moveTo(50, 100)
      .lineTo(545, 100)
      .strokeColor(BRANDING.primaryColor)
      .stroke();

    doc.moveDown(2);
  }

  /**
   * Add property title
   */
  private addPropertyTitle(doc: PDFKit.PDFDocument, property: PropertyWithSeller): void {
    doc
      .fontSize(FONTS.subheading.size)
      .font(FONTS.subheading.font)
      .fillColor('#000000')
      .text(property.title, 50, doc.y + LAYOUT.sectionSpacing, {
        align: 'left',
        width: 495,
      });

    doc.moveDown(1);
  }

  /**
   * Add property images (max 3 per page)
   * Requirement: 17.1
   */
  private async addPropertyImages(doc: PDFKit.PDFDocument, property: PropertyWithSeller): Promise<void> {
    if (!property.imageUrls || property.imageUrls.length === 0) {
      return;
    }

    const imagesToAdd = property.imageUrls.slice(0, LAYOUT.maxImagesPerPage);
    
    for (let i = 0; i < imagesToAdd.length; i++) {
      try {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        // Download image from URL
        const imageBuffer = await this.downloadImage(imagesToAdd[i]);

        // Add image to PDF
        doc.image(imageBuffer, 50, doc.y, {
          fit: [LAYOUT.imageWidth, LAYOUT.imageHeight],
          align: 'center',
        });

        doc.moveDown(2);
      } catch (error) {
        logWithContext('warn', 'Failed to add image to brochure', {
          imageUrl: imagesToAdd[i],
          error,
        });
        // Continue with other images
      }
    }
  }

  /**
   * Add property details section
   * Requirements: 17.2
   */
  private addPropertyDetails(doc: PDFKit.PDFDocument, property: PropertyWithSeller): void {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .fontSize(FONTS.subheading.size)
      .font(FONTS.subheading.font)
      .fillColor(BRANDING.primaryColor)
      .text('Property Details', 50, doc.y + LAYOUT.sectionSpacing);

    doc.moveDown(1);

    // Property type
    doc
      .fontSize(FONTS.body.size)
      .font(FONTS.heading.font)
      .fillColor('#000000')
      .text('Type: ', 50, doc.y, { continued: true })
      .font(FONTS.body.font)
      .text(this.formatPropertyType(property.propertyType));

    // Price with currency formatting
    const formattedPrice = formatPrice(property.price, property.currency || 'INR');
    doc
      .font(FONTS.heading.font)
      .text('Price: ', 50, doc.y, { continued: true })
      .font(FONTS.body.font)
      .text(formattedPrice);

    // Location
    doc
      .font(FONTS.heading.font)
      .text('Location: ', 50, doc.y, { continued: true })
      .font(FONTS.body.font)
      .text(this.formatLocation(property));

    // Address
    doc
      .font(FONTS.heading.font)
      .text('Address: ', 50, doc.y, { continued: true })
      .font(FONTS.body.font)
      .text(property.address, { width: 495 });

    doc.moveDown(1);

    // Description
    doc
      .fontSize(FONTS.subheading.size)
      .font(FONTS.subheading.font)
      .fillColor(BRANDING.primaryColor)
      .text('Description', 50, doc.y + LAYOUT.sectionSpacing);

    doc.moveDown(0.5);

    doc
      .fontSize(FONTS.body.size)
      .font(FONTS.body.font)
      .fillColor('#000000')
      .text(property.description, 50, doc.y, {
        width: 495,
        align: 'justify',
        lineGap: 5,
      });

    doc.moveDown(1);
  }

  /**
   * Add property features section (if available)
   * Requirement: 17.3
   */
  private addPropertyFeatures(doc: PDFKit.PDFDocument, property: PropertyWithSeller): void {
    // For now, we'll add a placeholder for features
    // In a real implementation, you would have a features field in the Property model
    // This section can be expanded when property features are added to the data model
    
    // Check if we need a new page
    if (doc.y > 700) {
      doc.addPage();
    }

    doc
      .fontSize(FONTS.subheading.size)
      .font(FONTS.subheading.font)
      .fillColor(BRANDING.primaryColor)
      .text('Features', 50, doc.y + LAYOUT.sectionSpacing);

    doc.moveDown(0.5);

    doc
      .fontSize(FONTS.body.size)
      .font(FONTS.body.font)
      .fillColor('#000000')
      .text(`• Property Type: ${this.formatPropertyType(property.propertyType)}`, 50, doc.y)
      .text(`• Status: ${property.status || 'Available'}`, 50, doc.y)
      .text(`• Region: ${property.region}`, 50, doc.y);

    doc.moveDown(1);
  }

  /**
   * Add seller contact information
   * Requirement: 17.4
   */
  private addSellerContact(doc: PDFKit.PDFDocument, seller: User): void {
    // Check if we need a new page
    if (doc.y > 700) {
      doc.addPage();
    }

    doc
      .fontSize(FONTS.subheading.size)
      .font(FONTS.subheading.font)
      .fillColor(BRANDING.primaryColor)
      .text('Contact Information', 50, doc.y + LAYOUT.sectionSpacing);

    doc.moveDown(0.5);

    doc
      .fontSize(FONTS.body.size)
      .font(FONTS.heading.font)
      .fillColor('#000000')
      .text('Name: ', 50, doc.y, { continued: true })
      .font(FONTS.body.font)
      .text(seller.fullName);

    doc
      .font(FONTS.heading.font)
      .text('Email: ', 50, doc.y, { continued: true })
      .font(FONTS.body.font)
      .text(seller.email);

    doc.moveDown(1);
  }

  /**
   * Add QR code linking to property detail page
   * Requirement: 17.5
   */
  private async addQRCode(doc: PDFKit.PDFDocument, propertyId: string): Promise<void> {
    try {
      // Generate property detail page URL
      const propertyUrl = `${this.FRONTEND_URL}/properties/${propertyId}`;

      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(propertyUrl, QR_CODE_BUFFER_OPTIONS);

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // Add QR code label
      doc
        .fontSize(FONTS.body.size)
        .font(FONTS.body.font)
        .fillColor('#000000')
        .text('Scan to view online:', 50, doc.y + LAYOUT.sectionSpacing);

      doc.moveDown(0.5);

      // Add QR code image
      const currentY = doc.y;
      doc.image(qrCodeBuffer, 50, currentY, {
        width: LAYOUT.qrCodeSize,
        height: LAYOUT.qrCodeSize,
      });

      doc.moveDown(3);
    } catch (error) {
      logWithContext('warn', 'Failed to generate QR code', { propertyId, error });
      // Continue without QR code
    }
  }

  /**
   * Add footer with branding
   * Requirement: 8.2
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Add horizontal line
      doc
        .moveTo(50, 792 - LAYOUT.footerHeight)
        .lineTo(545, 792 - LAYOUT.footerHeight)
        .strokeColor(BRANDING.primaryColor)
        .stroke();

      // Add footer text
      doc
        .fontSize(FONTS.footer.size)
        .font(FONTS.footer.font)
        .fillColor(BRANDING.secondaryColor)
        .text(
          `${BRANDING.companyName} | ${BRANDING.website} | Page ${i + 1} of ${pageCount}`,
          50,
          792 - LAYOUT.footerHeight + 10,
          { align: 'center', width: 495 }
        );
    }
  }

  /**
   * Upload PDF to Firebase Storage
   * Requirement: 8.5
   */
  private async uploadToStorage(pdfBuffer: Buffer, propertyId: string): Promise<BrochureResult> {
    const storage = getFirebaseStorage();
    const bucket = storage.bucket();

    // Generate filename with timestamp
    const timestamp = Date.now();
    const fileName = `brochure_${timestamp}.pdf`;
    const filePath = `brochures/${propertyId}/${fileName}`;

    // Upload file
    const file = bucket.file(filePath);
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          propertyId,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Convert buffer to stream and upload
    await new Promise<void>((resolve, reject) => {
      const readable = Readable.from(pdfBuffer);
      readable
        .pipe(stream)
        .on('error', reject)
        .on('finish', resolve);
    });

    // Generate signed URL with 1 hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.EXPIRATION_HOURS);

    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: expiresAt,
    });

    return {
      downloadUrl,
      expiresAt,
      fileName,
    };
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Format property type for display
   */
  private formatPropertyType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Format location from property data
   */
  private formatLocation(property: PropertyWithSeller): string {
    const parts = [property.region];
    
    // Add additional location details if available from seller
    if (property.seller.buy_city) {
      parts.push(property.seller.buy_city);
    }
    if (property.seller.buy_state) {
      parts.push(property.seller.buy_state);
    }
    if (property.seller.buy_country) {
      parts.push(property.seller.buy_country);
    }

    return parts.join(', ');
  }

  /**
   * Clean up expired brochures from storage
   * This should be called periodically (e.g., via a scheduled job)
   */
  async cleanupExpiredBrochures(): Promise<number> {
    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();

      const [files] = await bucket.getFiles({
        prefix: 'brochures/',
      });

      let deletedCount = 0;
      const now = new Date();

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdAt = new Date(metadata.timeCreated || metadata.updated || Date.now());
        
        // Delete files older than 24 hours
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreation > 24) {
          await file.delete();
          deletedCount++;
        }
      }

      logWithContext('info', 'Cleaned up expired brochures', { deletedCount });
      return deletedCount;
    } catch (error) {
      logWithContext('error', 'Error cleaning up expired brochures', { error });
      throw error;
    }
  }
}

export default new BrochureGeneratorService();
