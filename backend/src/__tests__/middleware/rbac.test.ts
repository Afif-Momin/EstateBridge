import { Response, NextFunction } from 'express';
import { attachUserRole, requireSeller, requireBuyer, requireRole } from '../../middleware/rbac';
import { getFirebaseFirestore } from '../../config/firebase';
import { AuthorizationError, NotFoundError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../types';

// Mock dependencies
jest.mock('../../config/firebase');
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RBAC Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockFirestore: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      userId: 'test-user-123',
      userEmail: 'test@example.com',
      path: '/api/test',
      method: 'GET',
    };

    // Setup mock response
    mockResponse = {};

    // Setup mock next function
    mockNext = jest.fn();

    // Setup mock Firestore
    mockFirestore = {
      collection: jest.fn(),
    };

    (getFirebaseFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('attachUserRole', () => {
    it('should attach buyer role when user exists in buyers collection', async () => {
      // Mock buyer document
      const mockBuyerDoc = {
        exists: true,
        data: () => ({ role: 'buyer', email: 'buyer@example.com' }),
      };

      const mockSellerDoc = {
        exists: false,
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => ({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(
            collectionName === 'buyers' ? mockBuyerDoc : mockSellerDoc
          ),
        }),
      }));

      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.userRole).toBe('buyer');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should attach seller role when user exists in sellers collection', async () => {
      // Mock seller document
      const mockBuyerDoc = {
        exists: false,
      };

      const mockSellerDoc = {
        exists: true,
        data: () => ({ role: 'seller', email: 'seller@example.com' }),
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => ({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(
            collectionName === 'buyers' ? mockBuyerDoc : mockSellerDoc
          ),
        }),
      }));

      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.userRole).toBe('seller');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should default to buyer role when role field is missing in buyers collection', async () => {
      // Mock buyer document without role field
      const mockBuyerDoc = {
        exists: true,
        data: () => ({ email: 'buyer@example.com' }),
      };

      const mockSellerDoc = {
        exists: false,
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => ({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(
            collectionName === 'buyers' ? mockBuyerDoc : mockSellerDoc
          ),
        }),
      }));

      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.userRole).toBe('buyer');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should default to seller role when role field is missing in sellers collection', async () => {
      // Mock seller document without role field
      const mockBuyerDoc = {
        exists: false,
      };

      const mockSellerDoc = {
        exists: true,
        data: () => ({ email: 'seller@example.com' }),
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => ({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(
            collectionName === 'buyers' ? mockBuyerDoc : mockSellerDoc
          ),
        }),
      }));

      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.userRole).toBe('seller');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw NotFoundError when user does not exist in either collection', async () => {
      // Mock both documents as non-existent
      const mockDoc = {
        exists: false,
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User profile not found');
    });

    it('should throw AuthorizationError when userId is not present', async () => {
      mockRequest.userId = undefined;

      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User must be authenticated to access this resource');
    });

    it('should handle Firestore errors gracefully', async () => {
      // Mock Firestore error
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('Firestore connection failed')),
        }),
      });

      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Failed to verify user permissions');
    });
  });

  describe('requireSeller', () => {
    it('should allow access when user has seller role', () => {
      mockRequest.userRole = 'seller';

      requireSeller(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should deny access when user has buyer role', () => {
      mockRequest.userRole = 'buyer';

      requireSeller(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('This resource requires seller role');
      expect(error.statusCode).toBe(403);
    });

    it('should throw error when userRole is not set', () => {
      mockRequest.userRole = undefined;

      requireSeller(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User role not found. Ensure attachUserRole middleware is used.');
    });
  });

  describe('requireBuyer', () => {
    it('should allow access when user has buyer role', () => {
      mockRequest.userRole = 'buyer';

      requireBuyer(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should deny access when user has seller role', () => {
      mockRequest.userRole = 'seller';

      requireBuyer(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('This resource requires buyer role');
      expect(error.statusCode).toBe(403);
    });

    it('should throw error when userRole is not set', () => {
      mockRequest.userRole = undefined;

      requireBuyer(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User role not found. Ensure attachUserRole middleware is used.');
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has the required role (seller)', () => {
      mockRequest.userRole = 'seller';
      const middleware = requireRole('seller');

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should allow access when user has the required role (buyer)', () => {
      mockRequest.userRole = 'buyer';
      const middleware = requireRole('buyer');

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should deny access when user does not have the required role', () => {
      mockRequest.userRole = 'buyer';
      const middleware = requireRole('seller');

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('This resource requires seller role');
      expect(error.statusCode).toBe(403);
    });

    it('should throw error when userRole is not set', () => {
      mockRequest.userRole = undefined;
      const middleware = requireRole('seller');

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User role not found. Ensure attachUserRole middleware is used.');
    });
  });

  describe('Integration scenarios', () => {
    it('should work in sequence: attachUserRole -> requireSeller', async () => {
      // Setup seller document
      const mockBuyerDoc = { exists: false };
      const mockSellerDoc = {
        exists: true,
        data: () => ({ role: 'seller' }),
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => ({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(
            collectionName === 'buyers' ? mockBuyerDoc : mockSellerDoc
          ),
        }),
      }));

      // First attach role
      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.userRole).toBe('seller');
      expect(mockNext).toHaveBeenCalledWith();

      // Reset next mock
      mockNext = jest.fn();

      // Then check seller access
      requireSeller(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should deny access in sequence: attachUserRole (buyer) -> requireSeller', async () => {
      // Setup buyer document
      const mockBuyerDoc = {
        exists: true,
        data: () => ({ role: 'buyer' }),
      };
      const mockSellerDoc = { exists: false };

      mockFirestore.collection.mockImplementation((collectionName: string) => ({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(
            collectionName === 'buyers' ? mockBuyerDoc : mockSellerDoc
          ),
        }),
      }));

      // First attach role
      await attachUserRole(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.userRole).toBe('buyer');
      expect(mockNext).toHaveBeenCalledWith();

      // Reset next mock
      mockNext = jest.fn();

      // Then check seller access (should fail)
      requireSeller(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('This resource requires seller role');
    });
  });
});
