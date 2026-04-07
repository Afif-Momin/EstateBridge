import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { getFirebaseAuth } from '../../config/firebase';
import { AuthenticationError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../types';

// Mock Firebase Auth
jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuth: any;

  beforeEach(() => {
    // Reset mocks
    mockRequest = {
      headers: {},
      path: '/api/test',
      method: 'GET',
    };
    mockResponse = {};
    mockNext = jest.fn();

    // Mock Firebase Auth
    mockAuth = {
      verifyIdToken: jest.fn(),
    };
    (getFirebaseAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    describe('successful authentication', () => {
      it('should authenticate valid token and attach userId and userEmail', async () => {
        const mockToken = 'valid-token-123';
        const mockDecodedToken = {
          uid: 'user-123',
          email: 'test@example.com',
        };

        mockRequest.headers = {
          authorization: `Bearer ${mockToken}`,
        };

        mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(mockToken);
        expect((mockRequest as AuthenticatedRequest).userId).toBe('user-123');
        expect((mockRequest as AuthenticatedRequest).userEmail).toBe('test@example.com');
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should handle token with extra whitespace', async () => {
        const mockToken = 'valid-token-123';
        const mockDecodedToken = {
          uid: 'user-456',
          email: 'user@test.com',
        };

        mockRequest.headers = {
          authorization: `Bearer  ${mockToken}  `,
        };

        mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect((mockRequest as AuthenticatedRequest).userId).toBe('user-456');
        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('missing authorization header', () => {
      it('should reject request without Authorization header', async () => {
        mockRequest.headers = {};

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Authorization header is required',
            statusCode: 401,
          })
        );
        expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
      });
    });

    describe('invalid authorization format', () => {
      it('should reject request with invalid authorization format (no Bearer prefix)', async () => {
        mockRequest.headers = {
          authorization: 'InvalidFormat token-123',
        };

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid authorization format. Expected: Bearer <token>',
            statusCode: 401,
          })
        );
        expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
      });

      it('should reject request with only "Bearer" and no token', async () => {
        mockRequest.headers = {
          authorization: 'Bearer ',
        };

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Token is required',
            statusCode: 401,
          })
        );
        expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
      });

      it('should reject request with Bearer and whitespace only', async () => {
        mockRequest.headers = {
          authorization: 'Bearer    ',
        };

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Token is required',
            statusCode: 401,
          })
        );
        expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
      });
    });

    describe('expired token', () => {
      it('should reject expired token with specific error message', async () => {
        mockRequest.headers = {
          authorization: 'Bearer expired-token',
        };

        const expiredError = new Error('Token expired');
        (expiredError as any).code = 'auth/id-token-expired';
        mockAuth.verifyIdToken.mockRejectedValue(expiredError);

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Token has expired',
            statusCode: 401,
          })
        );
      });
    });

    describe('invalid token', () => {
      it('should reject invalid token (auth/invalid-id-token)', async () => {
        mockRequest.headers = {
          authorization: 'Bearer invalid-token',
        };

        const invalidError = new Error('Invalid token');
        (invalidError as any).code = 'auth/invalid-id-token';
        mockAuth.verifyIdToken.mockRejectedValue(invalidError);

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid token',
            statusCode: 401,
          })
        );
      });

      it('should reject malformed token (auth/argument-error)', async () => {
        mockRequest.headers = {
          authorization: 'Bearer malformed-token',
        };

        const argumentError = new Error('Argument error');
        (argumentError as any).code = 'auth/argument-error';
        mockAuth.verifyIdToken.mockRejectedValue(argumentError);

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid token',
            statusCode: 401,
          })
        );
      });
    });

    describe('unexpected errors', () => {
      it('should handle unexpected Firebase errors gracefully', async () => {
        mockRequest.headers = {
          authorization: 'Bearer some-token',
        };

        const unexpectedError = new Error('Firebase service unavailable');
        mockAuth.verifyIdToken.mockRejectedValue(unexpectedError);

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Authentication failed',
            statusCode: 401,
          })
        );
      });

      it('should pass through AuthenticationError instances', async () => {
        mockRequest.headers = {
          authorization: 'Bearer some-token',
        };

        const authError = new AuthenticationError('Custom auth error');
        mockAuth.verifyIdToken.mockRejectedValue(authError);

        await authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(authError);
      });
    });
  });

  describe('optionalAuth middleware', () => {
    describe('successful optional authentication', () => {
      it('should authenticate valid token when provided', async () => {
        const mockToken = 'valid-token-123';
        const mockDecodedToken = {
          uid: 'user-789',
          email: 'optional@example.com',
        };

        mockRequest.headers = {
          authorization: `Bearer ${mockToken}`,
        };

        mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

        await optionalAuth(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(mockToken);
        expect((mockRequest as AuthenticatedRequest).userId).toBe('user-789');
        expect((mockRequest as AuthenticatedRequest).userEmail).toBe('optional@example.com');
        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('no authentication provided', () => {
      it('should continue without authentication when no header provided', async () => {
        mockRequest.headers = {};

        await optionalAuth(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
        expect((mockRequest as AuthenticatedRequest).userId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should continue without authentication when header has no Bearer prefix', async () => {
        mockRequest.headers = {
          authorization: 'InvalidFormat token',
        };

        await optionalAuth(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
        expect((mockRequest as AuthenticatedRequest).userId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should continue without authentication when token is empty', async () => {
        mockRequest.headers = {
          authorization: 'Bearer ',
        };

        await optionalAuth(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
        expect((mockRequest as AuthenticatedRequest).userId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledWith();
      });
    });

    describe('invalid token handling', () => {
      it('should continue without authentication when token verification fails', async () => {
        mockRequest.headers = {
          authorization: 'Bearer invalid-token',
        };

        const invalidError = new Error('Invalid token');
        (invalidError as any).code = 'auth/invalid-id-token';
        mockAuth.verifyIdToken.mockRejectedValue(invalidError);

        await optionalAuth(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).toHaveBeenCalled();
        expect((mockRequest as AuthenticatedRequest).userId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should continue without authentication when token is expired', async () => {
        mockRequest.headers = {
          authorization: 'Bearer expired-token',
        };

        const expiredError = new Error('Token expired');
        (expiredError as any).code = 'auth/id-token-expired';
        mockAuth.verifyIdToken.mockRejectedValue(expiredError);

        await optionalAuth(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).toHaveBeenCalled();
        expect((mockRequest as AuthenticatedRequest).userId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should continue without authentication on unexpected errors', async () => {
        mockRequest.headers = {
          authorization: 'Bearer some-token',
        };

        const unexpectedError = new Error('Network error');
        mockAuth.verifyIdToken.mockRejectedValue(unexpectedError);

        await optionalAuth(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockAuth.verifyIdToken).toHaveBeenCalled();
        expect((mockRequest as AuthenticatedRequest).userId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledWith();
      });
    });
  });
});
