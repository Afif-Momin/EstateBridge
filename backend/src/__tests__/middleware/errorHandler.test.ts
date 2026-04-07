import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  errorHandler,
} from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      path: '/api/v1/test',
      method: 'GET',
    };

    // Setup mock response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();

    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
  });

  describe('Custom Error Classes', () => {
    describe('ValidationError', () => {
      it('should create ValidationError with correct properties', () => {
        const error = new ValidationError('Invalid input', { field: 'email' });

        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Invalid input');
        expect(error.details).toEqual({ field: 'email' });
        expect(error.name).toBe('ValidationError');
      });

      it('should create ValidationError without details', () => {
        const error = new ValidationError('Invalid input');

        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Invalid input');
        expect(error.details).toBeUndefined();
      });
    });

    describe('AuthenticationError', () => {
      it('should create AuthenticationError with custom message', () => {
        const error = new AuthenticationError('Invalid token');

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Invalid token');
      });

      it('should create AuthenticationError with default message', () => {
        const error = new AuthenticationError();

        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Authentication failed');
      });
    });

    describe('AuthorizationError', () => {
      it('should create AuthorizationError with custom message', () => {
        const error = new AuthorizationError('Seller access required');

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.message).toBe('Seller access required');
      });

      it('should create AuthorizationError with default message', () => {
        const error = new AuthorizationError();

        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Insufficient permissions');
      });
    });

    describe('NotFoundError', () => {
      it('should create NotFoundError with custom message', () => {
        const error = new NotFoundError('Property not found');

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('Property not found');
      });

      it('should create NotFoundError with default message', () => {
        const error = new NotFoundError();

        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
      });
    });

    describe('DatabaseError', () => {
      it('should create DatabaseError with custom message', () => {
        const error = new DatabaseError('Connection failed');

        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.message).toBe('Connection failed');
      });

      it('should create DatabaseError with default message', () => {
        const error = new DatabaseError();

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Database operation failed');
      });
    });
  });

  describe('errorHandler Middleware', () => {
    describe('AppError Handling', () => {
      it('should handle ValidationError correctly', () => {
        const error = new ValidationError('Invalid email format', {
          fields: { email: ['Must be a valid email'] },
        });

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'VALIDATION_ERROR',
              message: 'Invalid email format',
              details: { fields: { email: ['Must be a valid email'] } },
            }),
            timestamp: expect.any(String),
          })
        );
      });

      it('should handle AuthenticationError correctly', () => {
        const error = new AuthenticationError('Token expired');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'UNAUTHORIZED',
              message: 'Token expired',
            }),
            timestamp: expect.any(String),
          })
        );
      });

      it('should handle AuthorizationError correctly', () => {
        const error = new AuthorizationError('Seller role required');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'FORBIDDEN',
              message: 'Seller role required',
            }),
          })
        );
      });

      it('should handle NotFoundError correctly', () => {
        const error = new NotFoundError('User not found');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'NOT_FOUND',
              message: 'User not found',
            }),
          })
        );
      });

      it('should handle DatabaseError correctly', () => {
        const error = new DatabaseError('Firestore connection failed');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'DATABASE_ERROR',
              message: 'Firestore connection failed',
            }),
          })
        );
      });
    });

    describe('Generic Error Handling', () => {
      it('should handle generic Error in development mode', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('Something went wrong');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Something went wrong',
              stack: expect.any(String),
            }),
          })
        );
      });

      it('should handle generic Error in production mode', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Something went wrong');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred',
            }),
          })
        );

        // Should not include stack trace in production
        const response = jsonMock.mock.calls[0][0];
        expect(response.error.stack).toBeUndefined();
      });
    });

    describe('Error Logging', () => {
      it('should log error with Winston logger', () => {
        const error = new ValidationError('Invalid input');
        (mockRequest as any).userId = 'user123';

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred',
          expect.objectContaining({
            error: 'Invalid input',
            stack: expect.any(String),
            path: '/api/v1/test',
            method: 'GET',
            userId: 'user123',
          })
        );
      });

      it('should log error without userId if not authenticated', () => {
        const error = new AuthenticationError();

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(logger.error).toHaveBeenCalledWith(
          'Error occurred',
          expect.objectContaining({
            path: '/api/v1/test',
            method: 'GET',
            userId: undefined,
          })
        );
      });
    });

    describe('Development vs Production Behavior', () => {
      it('should include stack trace in development mode for AppError', () => {
        process.env.NODE_ENV = 'development';
        const error = new ValidationError('Invalid input');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const response = jsonMock.mock.calls[0][0];
        expect(response.error.stack).toBeDefined();
        expect(typeof response.error.stack).toBe('string');
      });

      it('should not include stack trace in production mode for AppError', () => {
        process.env.NODE_ENV = 'production';
        const error = new ValidationError('Invalid input');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const response = jsonMock.mock.calls[0][0];
        expect(response.error.stack).toBeUndefined();
      });

      it('should include detailed error message in development mode', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('Detailed error message');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const response = jsonMock.mock.calls[0][0];
        expect(response.error.message).toBe('Detailed error message');
      });

      it('should hide detailed error message in production mode', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Detailed error message');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const response = jsonMock.mock.calls[0][0];
        expect(response.error.message).toBe('An unexpected error occurred');
      });
    });

    describe('Response Format', () => {
      it('should return consistent error response format', () => {
        const error = new ValidationError('Test error');

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const response = jsonMock.mock.calls[0][0];
        expect(response).toHaveProperty('success', false);
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('code');
        expect(response.error).toHaveProperty('message');
        expect(response).toHaveProperty('timestamp');
        expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
      });

      it('should include error details when provided', () => {
        const error = new ValidationError('Validation failed', {
          fields: { email: 'Invalid format', password: 'Too short' },
        });

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        const response = jsonMock.mock.calls[0][0];
        expect(response.error.details).toEqual({
          fields: { email: 'Invalid format', password: 'Too short' },
        });
      });
    });
  });
});
