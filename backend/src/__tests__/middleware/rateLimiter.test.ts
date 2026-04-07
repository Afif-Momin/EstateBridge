import { Response, NextFunction } from 'express';
import {
  registrationRateLimiter,
  propertyCreationRateLimiter,
  appointmentRequestRateLimiter,
} from '../../middleware/rateLimiter';
import rateLimitingService from '../../services/rateLimitingService';
import { AuthenticatedRequest } from '../../types';
import { RateLimitError, ValidationError, AuthenticationError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../services/rateLimitingService');
jest.mock('../../utils/logger');

describe('Rate Limiter Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
      params: {},
      path: '/test',
      method: 'POST',
      ip: undefined,
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('registrationRateLimiter', () => {
    it('should allow registration when rate limit is not exceeded', async () => {
      mockRequest = {
        ...mockRequest,
        ip: '192.168.1.1',
      };

      (rateLimitingService.checkRegistrationRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 4,
      });

      await registrationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(rateLimitingService.checkRegistrationRateLimit).toHaveBeenCalledWith('192.168.1.1');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract IP from x-forwarded-for header', async () => {
      mockRequest.headers = {
        'x-forwarded-for': '10.0.0.1, 192.168.1.1',
      };

      (rateLimitingService.checkRegistrationRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 4,
      });

      await registrationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(rateLimitingService.checkRegistrationRateLimit).toHaveBeenCalledWith('10.0.0.1');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw RateLimitError when rate limit is exceeded', async () => {
      mockRequest = {
        ...mockRequest,
        ip: '192.168.1.1',
      };
      const resetAt = new Date('2024-01-01T12:00:00Z');

      (rateLimitingService.checkRegistrationRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt,
      });

      await registrationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(RateLimitError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(429);
      expect(error.details.resetAt).toBe(resetAt.toISOString());
    });

    it('should continue on service error to avoid blocking users', async () => {
      mockRequest = {
        ...mockRequest,
        ip: '192.168.1.1',
      };

      (rateLimitingService.checkRegistrationRateLimit as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await registrationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('propertyCreationRateLimiter', () => {
    it('should throw AuthenticationError when user is not authenticated', async () => {
      await propertyCreationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should allow property creation when rate limit is not exceeded', async () => {
      mockRequest.userId = 'user123';

      (rateLimitingService.checkPropertyCreationLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 3,
      });

      await propertyCreationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(rateLimitingService.checkPropertyCreationLimit).toHaveBeenCalledWith('user123');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw RateLimitError when rate limit is exceeded', async () => {
      mockRequest.userId = 'user123';
      const resetAt = new Date('2024-01-02T12:00:00Z');

      (rateLimitingService.checkPropertyCreationLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt,
      });

      await propertyCreationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(RateLimitError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(429);
      expect(error.details.resetAt).toBe(resetAt.toISOString());
    });

    it('should continue on service error to avoid blocking users', async () => {
      mockRequest.userId = 'user123';

      (rateLimitingService.checkPropertyCreationLimit as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await propertyCreationRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('appointmentRequestRateLimiter', () => {
    it('should throw AuthenticationError when user is not authenticated', async () => {
      await appointmentRequestRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should throw ValidationError when propertyId is missing', async () => {
      mockRequest.userId = 'user123';

      await appointmentRequestRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should extract propertyId from params', async () => {
      mockRequest.userId = 'user123';
      mockRequest.params = { propertyId: 'prop123' };

      (rateLimitingService.checkAppointmentRequestLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 2,
      });

      await appointmentRequestRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(rateLimitingService.checkAppointmentRequestLimit).toHaveBeenCalledWith(
        'user123',
        'prop123'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract propertyId from body.listingId', async () => {
      mockRequest.userId = 'user123';
      mockRequest.body = { listingId: 'prop456' };

      (rateLimitingService.checkAppointmentRequestLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 2,
      });

      await appointmentRequestRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(rateLimitingService.checkAppointmentRequestLimit).toHaveBeenCalledWith(
        'user123',
        'prop456'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should extract propertyId from body.propertyId', async () => {
      mockRequest.userId = 'user123';
      mockRequest.body = { propertyId: 'prop789' };

      (rateLimitingService.checkAppointmentRequestLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 2,
      });

      await appointmentRequestRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(rateLimitingService.checkAppointmentRequestLimit).toHaveBeenCalledWith(
        'user123',
        'prop789'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw RateLimitError when rate limit is exceeded', async () => {
      mockRequest.userId = 'user123';
      mockRequest.body = { listingId: 'prop123' };

      (rateLimitingService.checkAppointmentRequestLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
      });

      await appointmentRequestRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(RateLimitError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(429);
    });

    it('should continue on service error to avoid blocking users', async () => {
      mockRequest.userId = 'user123';
      mockRequest.body = { listingId: 'prop123' };

      (rateLimitingService.checkAppointmentRequestLimit as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await appointmentRequestRateLimiter(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
