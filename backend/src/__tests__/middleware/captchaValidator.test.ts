import { Request, Response, NextFunction } from 'express';
import { validateCaptcha } from '../../middleware/captchaValidator';
import { ValidationError } from '../../middleware/errorHandler';
import verificationService from '../../services/verificationService';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/verificationService');
jest.mock('../../utils/logger');

describe('CAPTCHA Validator Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock request, response, and next
    mockRequest = {
      body: {},
      path: '/api/auth/register',
      method: 'POST',
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('validateCaptcha factory', () => {
    it('should return a middleware function', () => {
      const middleware = validateCaptcha('register');
      expect(typeof middleware).toBe('function');
    });
  });

  describe('CAPTCHA validation', () => {
    it('should call next() when CAPTCHA token is valid', async () => {
      // Arrange
      const action = 'register';
      const captchaToken = 'valid-token-123';
      mockRequest.body = { captchaToken };

      (verificationService.validateCaptcha as jest.Mock).mockResolvedValue(true);

      const middleware = validateCaptcha(action);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verificationService.validateCaptcha).toHaveBeenCalledWith(captchaToken, action);
      expect(mockNext).toHaveBeenCalledWith();
      expect(logger.info).toHaveBeenCalledWith(
        'CAPTCHA validation successful',
        expect.objectContaining({ action })
      );
    });

    it('should return ValidationError when CAPTCHA token is missing', async () => {
      // Arrange
      const action = 'register';
      mockRequest.body = {}; // No captchaToken

      const middleware = validateCaptcha(action);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verificationService.validateCaptcha).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('CAPTCHA token is required');
      expect(logger.warn).toHaveBeenCalledWith(
        'CAPTCHA token missing',
        expect.objectContaining({ action })
      );
    });

    it('should return ValidationError when CAPTCHA validation fails', async () => {
      // Arrange
      const action = 'register';
      const captchaToken = 'invalid-token';
      mockRequest.body = { captchaToken };

      (verificationService.validateCaptcha as jest.Mock).mockResolvedValue(false);

      const middleware = validateCaptcha(action);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verificationService.validateCaptcha).toHaveBeenCalledWith(captchaToken, action);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('CAPTCHA validation failed');
      expect(logger.warn).toHaveBeenCalledWith(
        'CAPTCHA validation failed',
        expect.objectContaining({ action })
      );
    });

    it('should handle verification service errors gracefully', async () => {
      // Arrange
      const action = 'register';
      const captchaToken = 'valid-token';
      mockRequest.body = { captchaToken };

      const serviceError = new Error('Network error');
      (verificationService.validateCaptcha as jest.Mock).mockRejectedValue(serviceError);

      const middleware = validateCaptcha(action);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verificationService.validateCaptcha).toHaveBeenCalledWith(captchaToken, action);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('CAPTCHA validation failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Error validating CAPTCHA',
        expect.objectContaining({
          error: 'Network error',
          action,
        })
      );
    });

    it('should work with different action types', async () => {
      // Arrange
      const actions = ['register', 'login', 'reset-password'];

      for (const action of actions) {
        jest.clearAllMocks();
        const captchaToken = `token-for-${action}`;
        mockRequest.body = { captchaToken };

        (verificationService.validateCaptcha as jest.Mock).mockResolvedValue(true);

        const middleware = validateCaptcha(action);

        // Act
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(verificationService.validateCaptcha).toHaveBeenCalledWith(captchaToken, action);
        expect(mockNext).toHaveBeenCalledWith();
      }
    });

    it('should handle empty string CAPTCHA token', async () => {
      // Arrange
      const action = 'register';
      mockRequest.body = { captchaToken: '' };

      const middleware = validateCaptcha(action);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verificationService.validateCaptcha).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('CAPTCHA token is required');
    });

    it('should handle null CAPTCHA token', async () => {
      // Arrange
      const action = 'register';
      mockRequest.body = { captchaToken: null };

      const middleware = validateCaptcha(action);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(verificationService.validateCaptcha).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('CAPTCHA token is required');
    });

    it('should pass through ValidationError from service', async () => {
      // Arrange
      const action = 'register';
      const captchaToken = 'valid-token';
      mockRequest.body = { captchaToken };

      const validationError = new ValidationError('Custom validation error');
      (verificationService.validateCaptcha as jest.Mock).mockRejectedValue(validationError);

      const middleware = validateCaptcha(action);

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });
});
