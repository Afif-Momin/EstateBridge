import { Response } from 'express';
import { requireEmailVerified } from '../../middleware/emailVerificationCheck';
import { getFirebaseFirestore } from '../../config/firebase';
import { AuthenticationError, AuthorizationError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../types';

// Mock dependencies
jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

describe('Email Verification Check Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockDb: any;
  let mockBuyerDoc: any;
  let mockSellerDoc: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request mock
    mockRequest = {
      userId: 'test-user-123',
      path: '/api/properties',
      method: 'POST',
    };

    // Setup response mock
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup next function mock
    mockNext = jest.fn();

    // Setup Firestore mocks
    mockBuyerDoc = {
      exists: false,
      data: jest.fn(),
    };

    mockSellerDoc = {
      exists: false,
      data: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);
  });

  describe('requireEmailVerified', () => {
    it('should allow access when buyer email is verified', async () => {
      // Setup: Buyer with verified email
      mockBuyerDoc.exists = true;
      mockBuyerDoc.data = jest.fn().mockReturnValue({
        email: 'buyer@example.com',
        emailVerified: true,
        role: 'buyer',
      });

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0]).toBeUndefined(); // No error passed
    });

    it('should allow access when seller email is verified', async () => {
      // Setup: Seller with verified email
      mockSellerDoc.exists = true;
      mockSellerDoc.data = jest.fn().mockReturnValue({
        email: 'seller@example.com',
        emailVerified: true,
        role: 'seller',
      });

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        if (collectionName === 'sellers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockSellerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0]).toBeUndefined(); // No error passed
    });

    it('should reject access when buyer email is not verified', async () => {
      // Setup: Buyer with unverified email
      mockBuyerDoc.exists = true;
      mockBuyerDoc.data = jest.fn().mockReturnValue({
        email: 'buyer@example.com',
        emailVerified: false,
        role: 'buyer',
      });

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      const error = mockNext.mock.calls[0][0] as AuthorizationError;
      expect(error.message).toContain('Email verification required');
    });

    it('should reject access when seller email is not verified', async () => {
      // Setup: Seller with unverified email
      mockSellerDoc.exists = true;
      mockSellerDoc.data = jest.fn().mockReturnValue({
        email: 'seller@example.com',
        emailVerified: false,
        role: 'seller',
      });

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        if (collectionName === 'sellers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockSellerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      const error = mockNext.mock.calls[0][0] as AuthorizationError;
      expect(error.message).toContain('Email verification required');
    });

    it('should reject access when emailVerified field is missing', async () => {
      // Setup: User without emailVerified field
      mockBuyerDoc.exists = true;
      mockBuyerDoc.data = jest.fn().mockReturnValue({
        email: 'buyer@example.com',
        role: 'buyer',
        // emailVerified field is missing
      });

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      const error = mockNext.mock.calls[0][0] as AuthorizationError;
      expect(error.message).toContain('Email verification required');
    });

    it('should reject access when emailVerified is undefined', async () => {
      // Setup: User with undefined emailVerified
      mockBuyerDoc.exists = true;
      mockBuyerDoc.data = jest.fn().mockReturnValue({
        email: 'buyer@example.com',
        emailVerified: undefined,
        role: 'buyer',
      });

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      const error = mockNext.mock.calls[0][0] as AuthorizationError;
      expect(error.message).toContain('Email verification required');
    });

    it('should reject access when user is not authenticated', async () => {
      // Setup: No userId in request
      mockRequest.userId = undefined;

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = mockNext.mock.calls[0][0] as AuthenticationError;
      expect(error.message).toContain('User must be authenticated');
    });

    it('should reject access when user profile is not found', async () => {
      // Setup: User not in buyers or sellers collection
      mockBuyerDoc.exists = false;
      mockSellerDoc.exists = false;

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        if (collectionName === 'sellers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockSellerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = mockNext.mock.calls[0][0] as AuthenticationError;
      expect(error.message).toContain('User profile not found');
    });

    it('should handle Firestore errors gracefully', async () => {
      // Setup: Firestore throws error
      mockDb.collection.mockImplementation(() => {
        throw new Error('Firestore connection error');
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      const error = mockNext.mock.calls[0][0] as AuthorizationError;
      expect(error.message).toContain('Failed to verify email verification status');
    });

    it('should check buyer collection first, then seller collection', async () => {
      // Setup: User is a seller (not in buyers collection)
      mockBuyerDoc.exists = false;
      mockSellerDoc.exists = true;
      mockSellerDoc.data = jest.fn().mockReturnValue({
        email: 'seller@example.com',
        emailVerified: true,
        role: 'seller',
      });

      const buyerGetMock = jest.fn().mockResolvedValue(mockBuyerDoc);
      const sellerGetMock = jest.fn().mockResolvedValue(mockSellerDoc);

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: buyerGetMock,
            }),
          };
        }
        if (collectionName === 'sellers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: sellerGetMock,
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(buyerGetMock).toHaveBeenCalled();
      expect(sellerGetMock).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext.mock.calls[0][0]).toBeUndefined(); // No error passed
    });

    it('should provide helpful error message for unverified users', async () => {
      // Setup: Unverified user
      mockBuyerDoc.exists = true;
      mockBuyerDoc.data = jest.fn().mockReturnValue({
        email: 'buyer@example.com',
        emailVerified: false,
        role: 'buyer',
      });

      mockDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'buyers') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockBuyerDoc),
            }),
          };
        }
        return mockDb;
      });

      // Execute
      await requireEmailVerified(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthorizationError));
      const error = mockNext.mock.calls[0][0] as AuthorizationError;
      expect(error.message).toContain('Email verification required');
      expect(error.message).toContain('Please verify your email before creating properties');
    });
  });
});
