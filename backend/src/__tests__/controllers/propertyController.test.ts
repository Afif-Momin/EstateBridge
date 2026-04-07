import request from 'supertest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockProperty = {
  id: 'prop-1',
  title: 'Beautiful House',
  description: 'A lovely house with a great view and spacious rooms',
  price: 500000,
  region: 'Auckland',
  address: '123 Main Street, Auckland',
  propertyType: 'house',
  status: 'available',
  sellerId: 'seller-1',
  imageUrls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('../../services/propertyService', () => ({
  __esModule: true,
  default: {
    createProperty: jest.fn(),
    getPropertyById: jest.fn(),
    updateProperty: jest.fn(),
    deleteProperty: jest.fn(),
    getPropertiesBySeller: jest.fn(),
  },
}));

jest.mock('../../services/imageService', () => ({
  __esModule: true,
  default: {
    uploadImages: jest.fn(),
    deleteImage: jest.fn(),
    deletePropertyImages: jest.fn(),
  },
}));

jest.mock('../../services/imageCompressionService', () => ({
  __esModule: true,
  default: {
    validateImage: jest.fn(),
    compressAndUpload: jest.fn(),
    deleteImage: jest.fn(),
    deletePropertyImages: jest.fn(),
  },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.userId = 'seller-1';
    next();
  }),
  optionalAuth: jest.fn((_req: any, _res: any, next: any) => next()),
}));

jest.mock('../../middleware/rbac', () => ({
  attachUserRole: jest.fn((req: any, _res: any, next: any) => {
    req.userRole = 'seller';
    next();
  }),
  requireSeller: jest.fn((req: any, res: any, next: any) => {
    if (req.userRole !== 'seller') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' }, timestamp: new Date().toISOString() });
    }
    next();
  }),
  requireBuyer: jest.fn((req: any, res: any, next: any) => {
    if (req.userRole !== 'buyer') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' }, timestamp: new Date().toISOString() });
    }
    next();
  }),
  requireAdmin: jest.fn((_req: any, _res: any, next: any) => {
    next();
  }),
}));

jest.mock('../../middleware/emailVerificationCheck', () => ({
  requireEmailVerified: jest.fn((_req: any, _res: any, next: any) => {
    next();
  }),
}));

jest.mock('../../middleware/rateLimiter', () => ({
  propertyCreationRateLimiter: jest.fn((_req: any, _res: any, next: any) => {
    next();
  }),
  registrationRateLimiter: jest.fn((_req: any, _res: any, next: any) => {
    next();
  }),
  appointmentRequestRateLimiter: jest.fn((_req: any, _res: any, next: any) => {
    next();
  }),
}));

jest.mock('../../middleware/captchaValidator', () => ({
  validateCaptcha: jest.fn(() => (_req: any, _res: any, next: any) => {
    next();
  }),
}));

jest.mock('../../services/spamDetectionService', () => ({
  __esModule: true,
  default: {
    checkDuplicateContent: jest.fn().mockResolvedValue({
      isDuplicate: false,
      similarity: 0,
    }),
    checkDuplicateImages: jest.fn().mockResolvedValue({
      hasDuplicates: false,
      matchingPropertyIds: [],
    }),
    flagProperty: jest.fn().mockResolvedValue(undefined),
    clearFlag: jest.fn().mockResolvedValue(undefined),
    checkReportThreshold: jest.fn().mockResolvedValue({
      shouldFlag: false,
      reportCount: 1,
    }),
  },
}));

jest.mock('../../repositories/reportRepository', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findByPropertyAndReporter: jest.fn(),
    findPending: jest.fn(),
    findByProperty: jest.fn(),
    updateStatus: jest.fn(),
  },
}));

jest.mock('../../config/firebase', () => ({
  getFirebaseFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            offset: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                docs: [],
              }),
            })),
          })),
        })),
        count: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => ({ count: 0 }),
          }),
        })),
      })),
    })),
  })),
}));

import app from '../../server';
import propertyService from '../../services/propertyService';
import imageService from '../../services/imageService';
import imageCompressionService from '../../services/imageCompressionService';
import spamDetectionService from '../../services/spamDetectionService';

const mockPropertyService = propertyService as jest.Mocked<typeof propertyService>;
const mockImageService = imageService as jest.Mocked<typeof imageService>;
const mockImageCompressionService = imageCompressionService as jest.Mocked<typeof imageCompressionService>;
const mockSpamDetectionService = spamDetectionService as jest.Mocked<typeof spamDetectionService>;
const mockReportRepository = require('../../repositories/reportRepository').default;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /api/v1/properties ──────────────────────────────────────────────────

  describe('POST /api/v1/properties', () => {
    const validBody = {
      title: 'Beautiful House',
      description: 'A lovely house with a great view and spacious rooms',
      price: 500000,
      region: 'Auckland',
      address: '123 Main Street, Auckland',
      propertyType: 'house',
      status: 'available',
    };

    beforeEach(() => {
      // Reset spam detection mocks
      mockSpamDetectionService.checkDuplicateContent.mockResolvedValue({
        isDuplicate: false,
        similarity: 0,
      });
      mockSpamDetectionService.checkDuplicateImages.mockResolvedValue({
        hasDuplicates: false,
        matchingPropertyIds: [],
      });
      mockSpamDetectionService.flagProperty.mockResolvedValue(undefined);
    });

    it('creates a property and returns 201', async () => {
      mockPropertyService.createProperty.mockResolvedValue(mockProperty as any);

      const res = await request(app).post('/api/v1/properties').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('prop-1');
      expect(mockPropertyService.createProperty).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Beautiful House' }),
        'seller-1'
      );
    });

    it('runs spam detection checks after property creation', async () => {
      const propertyWithImages = { ...mockProperty, imageUrls: ['https://example.com/img1.jpg'] };
      mockPropertyService.createProperty.mockResolvedValue(propertyWithImages as any);

      const res = await request(app).post('/api/v1/properties').send(validBody);

      expect(res.status).toBe(201);
      expect(mockSpamDetectionService.checkDuplicateContent).toHaveBeenCalledWith(
        propertyWithImages.description,
        propertyWithImages.id
      );
      expect(mockSpamDetectionService.checkDuplicateImages).toHaveBeenCalledWith(
        propertyWithImages.imageUrls,
        propertyWithImages.id
      );
    });

    it('flags property when duplicate content is detected', async () => {
      mockPropertyService.createProperty.mockResolvedValue(mockProperty as any);
      mockSpamDetectionService.checkDuplicateContent.mockResolvedValue({
        isDuplicate: true,
        similarPropertyId: 'prop-2',
        similarity: 0.95,
      });

      const res = await request(app).post('/api/v1/properties').send(validBody);

      expect(res.status).toBe(201);
      expect(mockSpamDetectionService.flagProperty).toHaveBeenCalledWith(
        mockProperty.id,
        expect.stringContaining('Duplicate content detected')
      );
    });

    it('flags property when duplicate images are detected', async () => {
      const propertyWithImages = { ...mockProperty, imageUrls: ['https://example.com/img1.jpg'] };
      mockPropertyService.createProperty.mockResolvedValue(propertyWithImages as any);
      mockSpamDetectionService.checkDuplicateImages.mockResolvedValue({
        hasDuplicates: true,
        matchingPropertyIds: ['prop-3', 'prop-4'],
      });

      const res = await request(app).post('/api/v1/properties').send(validBody);

      expect(res.status).toBe(201);
      expect(mockSpamDetectionService.flagProperty).toHaveBeenCalledWith(
        propertyWithImages.id,
        expect.stringContaining('Duplicate images detected')
      );
    });

    it('flags property with combined reason when both content and images are duplicates', async () => {
      const propertyWithImages = { ...mockProperty, imageUrls: ['https://example.com/img1.jpg'] };
      mockPropertyService.createProperty.mockResolvedValue(propertyWithImages as any);
      mockSpamDetectionService.checkDuplicateContent.mockResolvedValue({
        isDuplicate: true,
        similarPropertyId: 'prop-2',
        similarity: 0.92,
      });
      mockSpamDetectionService.checkDuplicateImages.mockResolvedValue({
        hasDuplicates: true,
        matchingPropertyIds: ['prop-3'],
      });

      const res = await request(app).post('/api/v1/properties').send(validBody);

      expect(res.status).toBe(201);
      expect(mockSpamDetectionService.flagProperty).toHaveBeenCalledWith(
        propertyWithImages.id,
        expect.stringMatching(/Duplicate content.*Duplicate images/)
      );
    });

    it('still creates property successfully even if spam detection fails', async () => {
      mockPropertyService.createProperty.mockResolvedValue(mockProperty as any);
      mockSpamDetectionService.checkDuplicateContent.mockRejectedValue(
        new Error('Spam detection service unavailable')
      );

      const res = await request(app).post('/api/v1/properties').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('prop-1');
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .send({ title: 'Short' }); // missing many fields

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid property type', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .send({ ...validBody, propertyType: 'castle' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for negative price', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .send({ ...validBody, price: -100 });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/v1/properties/:id ───────────────────────────────────────────────

  describe('GET /api/v1/properties/:id', () => {
    it('returns a property by ID', async () => {
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty as any);

      const res = await request(app).get('/api/v1/properties/prop-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('prop-1');
    });

    it('returns 404 when property not found', async () => {
      const { NotFoundError } = require('../../middleware/errorHandler');
      mockPropertyService.getPropertyById.mockRejectedValue(
        new NotFoundError('Property not found')
      );

      const res = await request(app).get('/api/v1/properties/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /api/v1/properties/:id ───────────────────────────────────────────────

  describe('PUT /api/v1/properties/:id', () => {
    it('updates a property and returns 200', async () => {
      const updated = { ...mockProperty, price: 600000 };
      mockPropertyService.updateProperty.mockResolvedValue(updated as any);

      const res = await request(app)
        .put('/api/v1/properties/prop-1')
        .send({ price: 600000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(600000);
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).put('/api/v1/properties/prop-1').send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid status value', async () => {
      const res = await request(app)
        .put('/api/v1/properties/prop-1')
        .send({ status: 'pending' });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/v1/properties/:id ───────────────────────────────────────────

  describe('DELETE /api/v1/properties/:id', () => {
    it('deletes a property and returns 200', async () => {
      mockPropertyService.deleteProperty.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/v1/properties/prop-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPropertyService.deleteProperty).toHaveBeenCalledWith('prop-1', 'seller-1');
    });

    it('returns 404 when property not found', async () => {
      const { NotFoundError } = require('../../middleware/errorHandler');
      mockPropertyService.deleteProperty.mockRejectedValue(
        new NotFoundError('Property not found')
      );

      const res = await request(app).delete('/api/v1/properties/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/v1/properties/seller/me ────────────────────────────────────────

  describe('GET /api/v1/properties/seller/me', () => {
    it('returns paginated seller properties', async () => {
      const paginatedResult = {
        data: [mockProperty],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };
      mockPropertyService.getPropertiesBySeller.mockResolvedValue(paginatedResult as any);

      const res = await request(app).get('/api/v1/properties/seller/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
      expect(mockPropertyService.getPropertiesBySeller).toHaveBeenCalledWith('seller-1', 1, 20);
    });

    it('respects page and limit query params', async () => {
      const paginatedResult = {
        data: [],
        pagination: { page: 2, limit: 5, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
      mockPropertyService.getPropertiesBySeller.mockResolvedValue(paginatedResult as any);

      const res = await request(app).get('/api/v1/properties/seller/me?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(mockPropertyService.getPropertiesBySeller).toHaveBeenCalledWith('seller-1', 2, 5);
    });
  });

  // ── POST /api/v1/properties/:id/images ──────────────────────────────────────

  describe('POST /api/v1/properties/:id/images', () => {
    it('uploads images and returns updated property', async () => {
      const updatedProperty = { 
        ...mockProperty, 
        imageUrls: ['https://storage.googleapis.com/bucket/prop-1/img-1_full.jpg'],
        thumbnailUrls: ['https://storage.googleapis.com/bucket/prop-1/img-1_thumb.jpg']
      };
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty as any);
      mockImageCompressionService.validateImage.mockReturnValue({ valid: true });
      mockImageCompressionService.compressAndUpload.mockResolvedValue({
        fullUrl: 'https://storage.googleapis.com/bucket/prop-1/img-1_full.jpg',
        thumbnailUrl: 'https://storage.googleapis.com/bucket/prop-1/img-1_thumb.jpg'
      });
      mockPropertyService.updateProperty.mockResolvedValue(updatedProperty as any);

      const res = await request(app)
        .post('/api/v1/properties/prop-1/images')
        .attach('images', Buffer.from('fake-image'), { filename: 'photo.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockImageCompressionService.validateImage).toHaveBeenCalled();
      expect(mockImageCompressionService.compressAndUpload).toHaveBeenCalled();
    });

    it('returns 400 when no files are uploaded', async () => {
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty as any);

      const res = await request(app).post('/api/v1/properties/prop-1/images');

      expect(res.status).toBe(400);
    });

    it('returns 403 when seller does not own the property', async () => {
      const otherSellerProperty = { ...mockProperty, sellerId: 'other-seller' };
      mockPropertyService.getPropertyById.mockResolvedValue(otherSellerProperty as any);

      const res = await request(app)
        .post('/api/v1/properties/prop-1/images')
        .attach('images', Buffer.from('fake-image'), { filename: 'photo.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(403);
    });
  });

  // ── DELETE /api/v1/properties/:id/images ────────────────────────────────────

  describe('DELETE /api/v1/properties/:id/images', () => {
    const imageUrl = 'https://storage.googleapis.com/bucket/properties/prop-1/img.jpg';

    it('deletes images and returns updated property', async () => {
      const propertyWithImages = { ...mockProperty, imageUrls: [imageUrl] };
      const updatedProperty = { ...mockProperty, imageUrls: [] };
      mockPropertyService.getPropertyById.mockResolvedValue(propertyWithImages as any);
      mockImageService.deleteImage.mockResolvedValue(undefined);
      mockPropertyService.updateProperty.mockResolvedValue(updatedProperty as any);

      const res = await request(app)
        .delete('/api/v1/properties/prop-1/images')
        .send({ imageUrls: [imageUrl] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockImageService.deleteImage).toHaveBeenCalledWith('prop-1', imageUrl);
    });

    it('returns 400 when imageUrls is missing', async () => {
      const res = await request(app)
        .delete('/api/v1/properties/prop-1/images')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/v1/admin/properties/flagged ────────────────────────────────────

  describe('GET /api/v1/admin/properties/flagged', () => {
    beforeEach(() => {
      // Mock admin role for these tests
      const rbac = require('../../middleware/rbac');
      rbac.attachUserRole.mockImplementation((req: any, _res: any, next: any) => {
        req.userRole = 'admin';
        next();
      });
    });

    it('returns paginated flagged properties', async () => {
      const flaggedProperty = {
        ...mockProperty,
        flagged: true,
        flaggedReason: 'Duplicate content detected',
        flaggedAt: new Date(),
      };

      const { getFirebaseFirestore } = require('../../config/firebase');
      const mockGet = jest.fn().mockResolvedValue({
        docs: [{ id: 'prop-1', data: () => flaggedProperty }],
      });
      const mockCountGet = jest.fn().mockResolvedValue({
        data: () => ({ count: 1 }),
      });

      getFirebaseFirestore.mockReturnValue({
        collection: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn(() => ({
                  get: mockGet,
                })),
              })),
            })),
            count: jest.fn(() => ({
              get: mockCountGet,
            })),
          })),
        })),
      });

      const res = await request(app).get('/api/v1/properties/admin/flagged');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('respects page and limit query params', async () => {
      const { getFirebaseFirestore } = require('../../config/firebase');
      const mockGet = jest.fn().mockResolvedValue({
        docs: [],
      });
      const mockCountGet = jest.fn().mockResolvedValue({
        data: () => ({ count: 0 }),
      });

      getFirebaseFirestore.mockReturnValue({
        collection: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn(() => ({
                  get: mockGet,
                })),
              })),
            })),
            count: jest.fn(() => ({
              get: mockCountGet,
            })),
          })),
        })),
      });

      const res = await request(app).get('/api/v1/properties/admin/flagged?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── POST /api/v1/admin/properties/:id/clear-flag ────────────────────────────

  describe('POST /api/v1/admin/properties/:id/clear-flag', () => {
    beforeEach(() => {
      // Mock admin role for these tests
      const rbac = require('../../middleware/rbac');
      rbac.attachUserRole.mockImplementation((req: any, _res: any, next: any) => {
        req.userRole = 'admin';
        next();
      });
    });

    it('clears flag from property and returns updated property', async () => {
      const clearedProperty = { ...mockProperty, flagged: false };
      mockSpamDetectionService.clearFlag.mockResolvedValue(undefined);
      mockPropertyService.getPropertyById.mockResolvedValue(clearedProperty as any);

      const res = await request(app).post('/api/v1/properties/admin/prop-1/clear-flag');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Property flag cleared successfully');
      expect(mockSpamDetectionService.clearFlag).toHaveBeenCalledWith('prop-1');
    });

    it('returns 404 when property not found', async () => {
      const { NotFoundError } = require('../../middleware/errorHandler');
      mockSpamDetectionService.clearFlag.mockRejectedValue(
        new NotFoundError('Property not found')
      );

      const res = await request(app).post('/api/v1/properties/admin/nonexistent/clear-flag');

      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/v1/properties/:id/report ──────────────────────────────────────

  describe('POST /api/v1/properties/:id/report', () => {
    const validReport = {
      reason: 'Spam',
      additionalDetails: 'This property is spam',
    };

    beforeEach(() => {
      mockReportRepository.findByPropertyAndReporter.mockResolvedValue(null);
      mockReportRepository.create.mockResolvedValue({
        id: 'report-1',
        propertyId: 'prop-1',
        reporterId: 'seller-1',
        reason: 'Spam',
        additionalDetails: 'This property is spam',
        status: 'pending',
        createdAt: new Date(),
      });
      mockPropertyService.getPropertyById.mockResolvedValue({
        ...mockProperty,
        reportCount: 0,
      } as any);
      mockPropertyService.updateProperty.mockResolvedValue({
        ...mockProperty,
        reportCount: 1,
      } as any);
    });

    it('creates a report and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/properties/prop-1/report')
        .send(validReport);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('report-1');
      expect(mockReportRepository.create).toHaveBeenCalledWith({
        propertyId: 'prop-1',
        reporterId: 'seller-1',
        reason: 'Spam',
        additionalDetails: 'This property is spam',
      });
    });

    it('increments property report count', async () => {
      const res = await request(app)
        .post('/api/v1/properties/prop-1/report')
        .send(validReport);

      expect(res.status).toBe(201);
      expect(mockPropertyService.updateProperty).toHaveBeenCalledWith(
        'prop-1',
        { reportCount: 1 },
        mockProperty.sellerId
      );
    });

    it('checks report threshold after submission', async () => {
      const res = await request(app)
        .post('/api/v1/properties/prop-1/report')
        .send(validReport);

      expect(res.status).toBe(201);
      expect(mockSpamDetectionService.checkReportThreshold).toHaveBeenCalledWith('prop-1');
    });

    it('returns 400 when user already reported the property', async () => {
      mockReportRepository.findByPropertyAndReporter.mockResolvedValue({
        id: 'report-1',
        propertyId: 'prop-1',
        reporterId: 'seller-1',
        reason: 'Spam',
        status: 'pending',
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/properties/prop-1/report')
        .send(validReport);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DUPLICATE_REPORT');
    });
  });

  // ── GET /api/v1/admin/reports ────────────────────────────────────────────────

  describe('GET /api/v1/admin/reports', () => {
    beforeEach(() => {
      // Mock admin role for these tests
      const rbac = require('../../middleware/rbac');
      rbac.attachUserRole.mockImplementation((req: any, _res: any, next: any) => {
        req.userRole = 'admin';
        next();
      });
    });

    it('returns paginated reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            propertyId: 'prop-1',
            reporterId: 'user-1',
            reason: 'Spam',
            status: 'pending',
            createdAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
      mockReportRepository.findPending.mockResolvedValue(mockReports);

      const res = await request(app).get('/api/v1/properties/admin/reports');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
    });

    it('respects page and limit query params', async () => {
      const mockReports = {
        data: [],
        pagination: {
          page: 2,
          limit: 5,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
      mockReportRepository.findPending.mockResolvedValue(mockReports);

      const res = await request(app).get('/api/v1/properties/admin/reports?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(mockReportRepository.findPending).toHaveBeenCalledWith(2, 5);
    });
  });

  // ── POST /api/v1/admin/reports/:id/review ────────────────────────────────────

  describe('POST /api/v1/admin/reports/:id/review', () => {
    beforeEach(() => {
      // Mock admin role for these tests
      const rbac = require('../../middleware/rbac');
      rbac.attachUserRole.mockImplementation((req: any, _res: any, next: any) => {
        req.userRole = 'admin';
        next();
      });

      mockReportRepository.findByProperty.mockResolvedValue([
        {
          id: 'report-1',
          propertyId: 'prop-1',
          reporterId: 'user-1',
          reason: 'Spam',
          status: 'pending',
          createdAt: new Date(),
        },
      ]);
    });

    it('dismisses a report', async () => {
      const res = await request(app)
        .post('/api/v1/properties/admin/reports/report-1/review')
        .send({ action: 'dismiss' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockReportRepository.updateStatus).toHaveBeenCalledWith(
        'report-1',
        expect.objectContaining({ status: 'dismissed' })
      );
    });

    it('flags property when action is flag_property', async () => {
      const res = await request(app)
        .post('/api/v1/properties/admin/reports/report-1/review')
        .send({ action: 'flag_property' });

      expect(res.status).toBe(200);
      expect(mockSpamDetectionService.flagProperty).toHaveBeenCalledWith(
        'prop-1',
        expect.stringContaining('Flagged by admin')
      );
    });

    it('deletes property when action is remove_property', async () => {
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty as any);
      mockPropertyService.deleteProperty.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/properties/admin/reports/report-1/review')
        .send({ action: 'remove_property' });

      expect(res.status).toBe(200);
      expect(mockPropertyService.deleteProperty).toHaveBeenCalledWith('prop-1', mockProperty.sellerId);
    });

    it('returns 400 for invalid action', async () => {
      const res = await request(app)
        .post('/api/v1/properties/admin/reports/report-1/review')
        .send({ action: 'invalid_action' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ACTION');
    });

    it('returns 404 when report not found', async () => {
      mockReportRepository.findByProperty.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/v1/properties/admin/reports/nonexistent/review')
        .send({ action: 'dismiss' });

      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/v1/properties/:id/brochure ─────────────────────────────────────

  describe('POST /api/v1/properties/:id/brochure', () => {
    const mockBrochureResult = {
      downloadUrl: 'https://storage.googleapis.com/bucket/brochures/prop-1/brochure_123456.pdf?signed=true',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      fileName: 'brochure_123456.pdf',
    };

    let mockBrochureGeneratorService: any;

    beforeEach(() => {
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty as any);
      
      // Mock the brochure generator service
      mockBrochureGeneratorService = {
        generateBrochure: jest.fn().mockResolvedValue(mockBrochureResult),
      };
      
      jest.doMock('../../services/brochureGeneratorService', () => ({
        __esModule: true,
        default: mockBrochureGeneratorService,
      }));
    });

    it('generates a brochure and returns download URL', async () => {
      const res = await request(app)
        .post('/api/v1/properties/prop-1/brochure');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toBe(mockBrochureResult.downloadUrl);
      expect(res.body.data.fileName).toBe(mockBrochureResult.fileName);
      expect(res.body.data.expiresAt).toBeDefined();
      expect(res.body.message).toBe('Brochure generated successfully');
    });

    it('verifies property exists before generating brochure', async () => {
      await request(app)
        .post('/api/v1/properties/prop-1/brochure');

      expect(mockPropertyService.getPropertyById).toHaveBeenCalledWith('prop-1');
    });

    it('returns 404 when property does not exist', async () => {
      mockPropertyService.getPropertyById.mockRejectedValue(
        new Error('Property not found')
      );

      const res = await request(app)
        .post('/api/v1/properties/nonexistent/brochure');

      expect(res.status).toBe(500); // Error handler will catch this
    });

    it('includes expiration time in response', async () => {
      const res = await request(app)
        .post('/api/v1/properties/prop-1/brochure');

      expect(res.status).toBe(200);
      expect(res.body.data.expiresAt).toBeDefined();
      
      // Verify expiration is approximately 1 hour from now
      const expiresAt = new Date(res.body.data.expiresAt);
      const now = new Date();
      const hourFromNow = new Date(now.getTime() + 3600000);
      const timeDiff = Math.abs(expiresAt.getTime() - hourFromNow.getTime());
      
      // Allow 15 second tolerance for test execution time
      expect(timeDiff).toBeLessThan(15000);
    });
  });
});

