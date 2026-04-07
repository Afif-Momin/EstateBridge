import request from 'supertest';
import app from '../../server';
import express, { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from '../../middleware/errorHandler';

describe('Error Handling Integration Tests', () => {
  // Create a test app with error routes
  const testApp = express();
  testApp.use(express.json());

  // Test routes that throw different errors
  testApp.get('/test/validation-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new ValidationError('Invalid input data', { field: 'email' }));
  });

  testApp.get('/test/auth-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new AuthenticationError('Token expired'));
  });

  testApp.get('/test/authorization-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new AuthorizationError('Seller role required'));
  });

  testApp.get('/test/not-found-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('Property not found'));
  });

  testApp.get('/test/database-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new DatabaseError('Firestore connection failed'));
  });

  testApp.get('/test/generic-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new Error('Unexpected error'));
  });

  // Import error handler from the main app
  const errorHandler = require('../../middleware/errorHandler').errorHandler;
  testApp.use(errorHandler);

  describe('ValidationError Integration', () => {
    it('should return 400 with validation error details', async () => {
      const response = await request(testApp).get('/test/validation-error');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: { field: 'email' },
        },
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('AuthenticationError Integration', () => {
    it('should return 401 with authentication error', async () => {
      const response = await request(testApp).get('/test/auth-error');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token expired',
        },
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('AuthorizationError Integration', () => {
    it('should return 403 with authorization error', async () => {
      const response = await request(testApp).get('/test/authorization-error');

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Seller role required',
        },
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('NotFoundError Integration', () => {
    it('should return 404 with not found error', async () => {
      const response = await request(testApp).get('/test/not-found-error');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property not found',
        },
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('DatabaseError Integration', () => {
    it('should return 500 with database error', async () => {
      const response = await request(testApp).get('/test/database-error');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Firestore connection failed',
        },
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Generic Error Integration', () => {
    it('should return 500 with generic error in test environment', async () => {
      const response = await request(testApp).get('/test/generic-error');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
      expect(response.body.timestamp).toBeDefined();
      // In test/development, should show actual error message
      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('Main App 404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent error format across all error types', async () => {
      const errorRoutes = [
        '/test/validation-error',
        '/test/auth-error',
        '/test/authorization-error',
        '/test/not-found-error',
        '/test/database-error',
      ];

      for (const route of errorRoutes) {
        const response = await request(testApp).get(route);

        // All errors should have consistent structure
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');

        // Timestamp should be valid ISO string
        expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
      }
    });
  });

  describe('Error Response Headers', () => {
    it('should return correct content-type header', async () => {
      const response = await request(testApp).get('/test/validation-error');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
