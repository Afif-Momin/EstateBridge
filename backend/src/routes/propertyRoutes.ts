import { Router } from 'express';
import {
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getSellerProperties,
  uploadPropertyImages,
  deletePropertyImages,
  updatePropertyProStatus,
  approveProperty,
  rejectProperty,
  getPendingProperties,
  getFlaggedProperties,
  clearPropertyFlag,
  reportProperty,
  getReports,
  reviewReport,
  generateBrochure,
  upload,
} from '../controllers/propertyController';
import { authenticate } from '../middleware/auth';
import { attachUserRole, requireSeller, requireAdmin } from '../middleware/rbac';
import { validate, createPropertySchema, updatePropertySchema, deleteImagesSchema } from '../validators/propertyValidator';
import { requireEmailVerified } from '../middleware/emailVerificationCheck';
import { propertyCreationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   GET /api/v1/properties/seller/me
 * @desc    Get all properties for the authenticated seller
 * @access  Private (seller only)
 * NOTE: This route must be defined BEFORE /:id to avoid "seller" being treated as an ID
 */
router.get(
  '/seller/me',
  authenticate,
  attachUserRole,
  requireSeller,
  getSellerProperties
);

/**
 * @route   GET /api/v1/admin/properties/pending
 * @desc    Get all pending properties
 * @access  Private (admin only)
 * NOTE: Admin routes must be defined BEFORE /:id to avoid "admin" being treated as an ID
 */
router.get(
  '/admin/pending',
  authenticate,
  attachUserRole,
  requireAdmin,
  getPendingProperties
);

/**
 * @route   GET /api/v1/admin/properties/flagged
 * @desc    Get all flagged properties
 * @access  Private (admin only)
 */
router.get(
  '/admin/flagged',
  authenticate,
  attachUserRole,
  requireAdmin,
  getFlaggedProperties
);

/**
 * @route   POST /api/v1/admin/properties/:id/approve
 * @desc    Approve a property
 * @access  Private (admin only)
 */
router.post(
  '/admin/:id/approve',
  authenticate,
  attachUserRole,
  requireAdmin,
  approveProperty
);

/**
 * @route   POST /api/v1/admin/properties/:id/reject
 * @desc    Reject a property
 * @access  Private (admin only)
 */
router.post(
  '/admin/:id/reject',
  authenticate,
  attachUserRole,
  requireAdmin,
  rejectProperty
);

/**
 * @route   POST /api/v1/admin/properties/:id/clear-flag
 * @desc    Clear flag from a property
 * @access  Private (admin only)
 */
router.post(
  '/admin/:id/clear-flag',
  authenticate,
  attachUserRole,
  requireAdmin,
  clearPropertyFlag
);

/**
 * @route   POST /api/v1/properties
 * @desc    Create a new property listing
 * @access  Private (seller only)
 */
router.post(
  '/',
  authenticate,
  attachUserRole,
  requireSeller,
  requireEmailVerified,
  propertyCreationRateLimiter,
  validate(createPropertySchema),
  createProperty
);

/**
 * @route   GET /api/v1/properties/:id
 * @desc    Get a property by ID
 * @access  Public
 */
router.get('/:id', getPropertyById);

/**
 * @route   PUT /api/v1/properties/:id
 * @desc    Update a property
 * @access  Private (seller only, ownership check)
 */
router.put(
  '/:id',
  authenticate,
  attachUserRole,
  requireSeller,
  validate(updatePropertySchema),
  updateProperty
);

/**
 * @route   DELETE /api/v1/properties/:id
 * @desc    Delete a property and its images
 * @access  Private (seller only, ownership check)
 */
router.delete(
  '/:id',
  authenticate,
  attachUserRole,
  requireSeller,
  deleteProperty
);

/**
 * @route   POST /api/v1/properties/:id/images
 * @desc    Upload images for a property
 * @access  Private (seller only)
 */
router.post(
  '/:id/images',
  authenticate,
  attachUserRole,
  requireSeller,
  upload.array('images', 10),
  uploadPropertyImages
);

/**
 * @route   DELETE /api/v1/properties/:id/images
 * @desc    Delete specific images from a property
 * @access  Private (seller only)
 */
router.delete(
  '/:id/images',
  authenticate,
  attachUserRole,
  requireSeller,
  validate(deleteImagesSchema),
  deletePropertyImages
);

/**
 * @route   PATCH /api/v1/properties/:id/status
 * @desc    Update property pro_status
 * @access  Private (seller or admin)
 */
router.patch(
  '/:id/status',
  authenticate,
  attachUserRole,
  updatePropertyProStatus
);

/**
 * @route   GET /api/v1/admin/reports
 * @desc    Get all pending reports
 * @access  Private (admin only)
 */
router.get(
  '/admin/reports',
  authenticate,
  attachUserRole,
  requireAdmin,
  getReports
);

/**
 * @route   POST /api/v1/admin/reports/:id/review
 * @desc    Review a report
 * @access  Private (admin only)
 */
router.post(
  '/admin/reports/:id/review',
  authenticate,
  attachUserRole,
  requireAdmin,
  reviewReport
);

/**
 * @route   POST /api/v1/properties/:id/report
 * @desc    Report a property
 * @access  Private (authenticated users)
 */
router.post(
  '/:id/report',
  authenticate,
  reportProperty
);

/**
 * @route   POST /api/v1/properties/:id/brochure
 * @desc    Generate and download property brochure
 * @access  Private (authenticated users)
 */
router.post(
  '/:id/brochure',
  authenticate,
  generateBrochure
);

export default router;
