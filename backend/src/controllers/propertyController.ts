import { Response, NextFunction } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../types';
import propertyService from '../services/propertyService';
import imageService from '../services/imageService';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { IMAGE_UPLOAD, PAGINATION } from '../constants';
import { getFirebaseFirestore } from '../config/firebase';

// ─── Multer configuration (memory storage) ────────────────────────────────────

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_UPLOAD.MAX_SIZE,
    files: IMAGE_UPLOAD.MAX_COUNT,
  },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_UPLOAD.ALLOWED_FORMATS.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePagination(query: any): { page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit as string) || PAGINATION.DEFAULT_LIMIT)
  );
  return { page, limit };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/properties
 * Create a new property (seller only)
 * Requires email verification and applies rate limiting
 */
export const createProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sellerId = req.userId!;
    
    // Set initial pro_status to "Waiting for Admin Approval"
    const propertyData = {
      ...req.body,
      pro_status: 'Waiting for Admin Approval' as const,
    };
    
    const property = await propertyService.createProperty(propertyData, sellerId);

    // Run spam detection checks (non-blocking)
    try {
      // Lazy import to avoid circular dependency
      const { default: spamDetectionService } = await import('../services/spamDetectionService');
      
      // Check for duplicate content
      const contentCheck = await spamDetectionService.checkDuplicateContent(
        property.description,
        property.id
      );
      
      // Check for duplicate images if property has images
      const imageCheck = property.imageUrls && property.imageUrls.length > 0
        ? await spamDetectionService.checkDuplicateImages(
            property.imageUrls,
            property.id
          )
        : { hasDuplicates: false, matchingPropertyIds: [] };
      
      // Flag property if suspicious patterns detected
      if (contentCheck.isDuplicate || imageCheck.hasDuplicates) {
        const reasons: string[] = [];
        
        if (contentCheck.isDuplicate) {
          reasons.push(
            `Duplicate content detected (${Math.round(contentCheck.similarity * 100)}% similar to property ${contentCheck.similarPropertyId})`
          );
        }
        
        if (imageCheck.hasDuplicates) {
          reasons.push(
            `Duplicate images detected (matches properties: ${imageCheck.matchingPropertyIds.join(', ')})`
          );
        }
        
        const flagReason = reasons.join('; ');
        await spamDetectionService.flagProperty(property.id, flagReason);
        
        logger.info('Property flagged for suspicious patterns', {
          propertyId: property.id,
          sellerId,
          reason: flagReason,
        });
      }
    } catch (spamCheckError) {
      // Log error but don't fail property creation
      logger.error('Spam detection check failed', {
        propertyId: property.id,
        sellerId,
        error: spamCheckError,
      });
    }

    logger.info('Property created', { propertyId: property.id, sellerId, pro_status: property.pro_status });

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property submitted for admin approval',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/properties/:id
 * Get a property by ID (public)
 */
export const getPropertyById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);

    res.status(200).json({
      success: true,
      data: property,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/properties/:id
 * Update a property (seller only, ownership check)
 */
export const updateProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const sellerId = req.userId!;
    const property = await propertyService.updateProperty(id, req.body, sellerId);

    logger.info('Property updated', { propertyId: id, sellerId });

    res.status(200).json({
      success: true,
      data: property,
      message: 'Property updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/properties/:id
 * Delete a property (seller only, ownership check)
 */
export const deleteProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const sellerId = req.userId!;
    await propertyService.deleteProperty(id, sellerId);

    logger.info('Property deleted', { propertyId: id, sellerId });

    res.status(200).json({
      success: true,
      data: null,
      message: 'Property deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/properties/seller/me
 * Get all properties for the authenticated seller
 */
export const getSellerProperties = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sellerId = req.userId!;
    const { page, limit } = parsePagination(req.query);
    const result = await propertyService.getPropertiesBySeller(sellerId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/properties/:id/images
 * Upload images for a property (seller only)
 */
export const uploadPropertyImages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const sellerId = req.userId!;

    // Verify ownership before uploading
    const property = await propertyService.getPropertyById(id);
    if (property.sellerId !== sellerId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to upload images for this property',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new ValidationError('No files uploaded');
    }

    const files = req.files as Express.Multer.File[];

    // Check total image count (existing + new)
    const existingCount = property.imageUrls.length;
    if (existingCount + files.length > IMAGE_UPLOAD.MAX_COUNT) {
      throw new ValidationError(
        `Cannot exceed ${IMAGE_UPLOAD.MAX_COUNT} images per property. Property already has ${existingCount} image(s).`
      );
    }

    // Lazy import to avoid circular dependency
    const { default: imageCompressionService } = await import('../services/imageCompressionService');

    // Validate all images before processing
    for (const file of files) {
      const validationResult = imageCompressionService.validateImage(file.buffer, file.mimetype);
      if (!validationResult.valid) {
        throw new ValidationError(validationResult.error || 'Image validation failed');
      }
    }

    // Compress and upload images
    const fullUrls: string[] = [];
    const thumbnailUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageId = `${Date.now()}-${i}`;
      
      const result = await imageCompressionService.compressAndUpload(
        file.buffer,
        id,
        imageId
      );
      
      fullUrls.push(result.fullUrl);
      thumbnailUrls.push(result.thumbnailUrl);
    }

    // Persist both full and thumbnail URLs to the property document
    const updatedProperty = await propertyService.updateProperty(
      id,
      { 
        imageUrls: [...property.imageUrls, ...fullUrls],
        thumbnailUrls: [...(property.thumbnailUrls || []), ...thumbnailUrls]
      },
      sellerId
    );

    logger.info('Images uploaded and compressed', { 
      propertyId: id, 
      count: fullUrls.length,
      fullUrls,
      thumbnailUrls
    });

    res.status(200).json({
      success: true,
      data: updatedProperty,
      message: `${fullUrls.length} image(s) uploaded and compressed successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/properties/:id/images
 * Delete images from a property (seller only)
 * Body: { imageUrls: string[] }
 */
export const deletePropertyImages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const sellerId = req.userId!;
    const { imageUrls } = req.body as { imageUrls: string[] };

    // Verify ownership
    const property = await propertyService.getPropertyById(id);
    if (property.sellerId !== sellerId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to delete images for this property',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Delete from Storage
    await Promise.all(imageUrls.map((url) => imageService.deleteImage(id, url)));

    // Remove URLs from property document
    const remainingUrls = property.imageUrls.filter((url) => !imageUrls.includes(url));
    const updatedProperty = await propertyService.updateProperty(
      id,
      { imageUrls: remainingUrls },
      sellerId
    );

    logger.info('Images deleted', { propertyId: id, count: imageUrls.length });

    res.status(200).json({
      success: true,
      data: updatedProperty,
      message: `${imageUrls.length} image(s) deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/properties/:id/status
 * Update property pro_status (seller or admin)
 * Body: { pro_status: PropertyProStatus }
 */
export const updatePropertyProStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.userRole;
    const { pro_status } = req.body;

    // Verify ownership or admin role
    const property = await propertyService.getPropertyById(id);
    
    const isOwner = property.sellerId === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to update this property status',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate status transition
    const validStatuses = [
      'For Sale',
      'For Rent',
      'Under Construction',
      'Closed',
      'Finished',
      'Waiting for Admin Approval',
      'Rejected',
    ];
    
    if (!validStatuses.includes(pro_status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid property status',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const updatedProperty = await propertyService.updateProperty(
      id,
      { pro_status },
      userId
    );

    logger.info('Property pro_status updated', { propertyId: id, userId, pro_status });

    res.status(200).json({
      success: true,
      data: updatedProperty,
      message: 'Property status updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/properties/:id/approve
 * Approve a property (admin only)
 * Body: { approvedStatus: PropertyProStatus }
 */
export const approveProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const { approvedStatus } = req.body;

    // Lazy import to avoid circular dependency
    const { default: propertyStatusService } = await import('../services/propertyStatusService');
    const property = await propertyStatusService.approveProperty(id, adminId, approvedStatus);

    logger.info('Property approved by admin', { propertyId: id, adminId, approvedStatus });

    res.status(200).json({
      success: true,
      data: property,
      message: 'Property approved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/properties/:id/reject
 * Reject a property (admin only)
 * Body: { reason: string }
 */
export const rejectProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const { reason } = req.body;

    // Lazy import to avoid circular dependency
    const { default: propertyStatusService } = await import('../services/propertyStatusService');
    const property = await propertyStatusService.rejectProperty(id, adminId, reason);

    logger.info('Property rejected by admin', { propertyId: id, adminId, reason });

    res.status(200).json({
      success: true,
      data: property,
      message: 'Property rejected successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/properties/pending
 * Get all pending properties (admin only)
 */
export const getPendingProperties = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = parsePagination(req.query);

    // Lazy import to avoid circular dependency
    const { default: propertyStatusService } = await import('../services/propertyStatusService');
    const result = await propertyStatusService.getPendingProperties(page, limit);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/properties/flagged
 * Get all flagged properties (admin only)
 */
export const getFlaggedProperties = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = parsePagination(req.query);

    // Query flagged properties
    const offset = (page - 1) * limit;

    const snapshot = await getFirebaseFirestore()
      .collection('properties')
      .where('flagged', '==', true)
      .orderBy('flaggedAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const countSnapshot = await getFirebaseFirestore()
      .collection('properties')
      .where('flagged', '==', true)
      .count()
      .get();

    const total = countSnapshot.data().count;
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const result = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    logger.info('Flagged properties fetched', { page, limit, total });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/properties/:id/clear-flag
 * Clear flag from a property (admin only)
 */
export const clearPropertyFlag = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;

    // Lazy import to avoid circular dependency
    const { default: spamDetectionService } = await import('../services/spamDetectionService');
    await spamDetectionService.clearFlag(id);

    // Fetch updated property
    const property = await propertyService.getPropertyById(id);

    logger.info('Property flag cleared by admin', { propertyId: id, adminId });

    res.status(200).json({
      success: true,
      data: property,
      message: 'Property flag cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/properties/:id/report
 * Submit a report for a property (authenticated users)
 * Body: { reason: ReportReason, additionalDetails?: string }
 */
export const reportProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const reporterId = req.userId!;
    const { reason, additionalDetails } = req.body;

    // Lazy import to avoid circular dependency
    const { default: reportRepository } = await import('../repositories/reportRepository');
    const { default: spamDetectionService } = await import('../services/spamDetectionService');

    // Check if user already reported this property
    const existingReport = await reportRepository.findByPropertyAndReporter(id, reporterId);
    if (existingReport) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_REPORT',
          message: 'You have already reported this property',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Create the report
    const report = await reportRepository.create({
      propertyId: id,
      reporterId,
      reason,
      additionalDetails,
    });

    // Increment property report count
    const property = await propertyService.getPropertyById(id);
    const newReportCount = (property.reportCount || 0) + 1;
    await propertyService.updateProperty(
      id,
      { reportCount: newReportCount },
      property.sellerId // Use seller ID to bypass ownership check
    );

    // Check if property should be auto-flagged based on report threshold
    await spamDetectionService.checkReportThreshold(id);

    logger.info('Property reported', { propertyId: id, reporterId, reason, reportCount: newReportCount });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Property reported successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/reports
 * Get all pending reports (admin only)
 */
export const getReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = parsePagination(req.query);

    // Lazy import to avoid circular dependency
    const { default: reportRepository } = await import('../repositories/reportRepository');
    const result = await reportRepository.findPending(page, limit);

    logger.info('Reports fetched', { page, limit, total: result.pagination.total });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/reports/:id/review
 * Review a report (admin only)
 * Body: { action: 'dismiss' | 'flag_property' | 'remove_property' }
 */
export const reviewReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const { action } = req.body;

    // Lazy import to avoid circular dependency
    const { default: reportRepository } = await import('../repositories/reportRepository');
    const { default: spamDetectionService } = await import('../services/spamDetectionService');

    // Get the report
    const reports = await reportRepository.findByProperty(id);
    if (reports.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const report = reports.find(r => r.id === id);
    if (!report) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Perform action based on admin decision
    switch (action) {
      case 'dismiss':
        await reportRepository.updateStatus(id, {
          status: 'dismissed',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        });
        break;

      case 'flag_property':
        await spamDetectionService.flagProperty(
          report.propertyId,
          `Flagged by admin after reviewing report: ${report.reason}`
        );
        await reportRepository.updateStatus(id, {
          status: 'reviewed',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        });
        break;

      case 'remove_property':
        // Delete the property
        const property = await propertyService.getPropertyById(report.propertyId);
        await propertyService.deleteProperty(report.propertyId, property.sellerId);
        await reportRepository.updateStatus(id, {
          status: 'reviewed',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        });
        break;

      default:
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'Invalid action. Must be one of: dismiss, flag_property, remove_property',
          },
          timestamp: new Date().toISOString(),
        });
        return;
    }

    logger.info('Report reviewed', { reportId: id, adminId, action });

    res.status(200).json({
      success: true,
      data: null,
      message: `Report ${action === 'dismiss' ? 'dismissed' : 'reviewed'} successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/properties/:id/brochure
 * Generate and download property brochure (authenticated users)
 */
export const generateBrochure = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verify property exists
    await propertyService.getPropertyById(id);

    // Lazy import to avoid circular dependency
    const { default: brochureGeneratorService } = await import('../services/brochureGeneratorService');

    // Generate brochure
    const result = await brochureGeneratorService.generateBrochure(id, userId);

    logger.info('Brochure generated', { 
      propertyId: id, 
      userId, 
      fileName: result.fileName,
      expiresAt: result.expiresAt 
    });

    res.status(200).json({
      success: true,
      data: {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
        fileName: result.fileName,
      },
      message: 'Brochure generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
