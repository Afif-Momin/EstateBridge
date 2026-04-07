import { Response, NextFunction } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUserProfile,
  verifyEmail,
  resendVerification,
  getVerificationStatus,
} from '../../controllers/authController';
import * as authService from '../../services/authService';
import * as currencyService from '../../services/currencyService';
import verificationService from '../../services/verificationService';
import { AuthenticatedRequest } from '../../types';
import { createMockRequest, createMockResponse, createMockNext } from '../utils/testHelpers';
import { UserFactory } from '../factories/userFactory';
import { ValidationError, AuthenticationError, NotFoundError } from '../../middleware/errorHandler';

// Mock the auth service and currency service
jest.mock('../../services/authService');
jest.mock('../../services/currencyService');
jest.mock('../../utils/logger');
jest.mock('../../services/verificationService');

describe('Auth Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
    
    // Mock currency service methods
    (currencyService.currencyService.validateCountryCode as jest.Mock) = jest.fn().mockReturnValue(true);
    (currencyService.currencyService.validatePincode as jest.Mock) = jest.fn().mockReturnValue(true);
    (currencyService.currencyService.determineCurrency as jest.Mock) = jest.fn().mockReturnValue('USD');
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = UserFactory.createRegisterDTO();
      const user = UserFactory.create({
        email: registerData.email,
        fullName: registerData.fullName,
        role: registerData.role,
      });

      mockRequest.body = registerData;

      const mockResult = {
        user,
        message: 'User registered successfully',
      };

      (authService.registerUser as jest.Mock).mockResolvedValue(mockResult);

      await register(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(currencyService.currencyService.validateCountryCode).toHaveBeenCalledWith(registerData.buy_country);
      expect(currencyService.currencyService.validatePincode).toHaveBeenCalledWith(registerData.buy_pincode, registerData.buy_country);
      expect(currencyService.currencyService.determineCurrency).toHaveBeenCalledWith(registerData.buy_country);
      expect(authService.registerUser).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        fullName: registerData.fullName,
        role: registerData.role,
        buy_country: registerData.buy_country,
        buy_city: registerData.buy_city,
        buy_state: registerData.buy_state,
        buy_address: registerData.buy_address,
        buy_pincode: registerData.buy_pincode,
        idToken: undefined,
        currency: 'USD',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { user },
        message: mockResult.message,
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const registerData = UserFactory.createRegisterDTO({ email: 'invalid-email' });
      mockRequest.body = registerData;

      const validationError = new ValidationError('Invalid email format');
      (authService.registerUser as jest.Mock).mockRejectedValue(validationError);

      await register(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle duplicate email errors', async () => {
      const registerData = UserFactory.createRegisterDTO();
      mockRequest.body = registerData;

      const conflictError = new Error('Email already exists');
      (authService.registerUser as jest.Mock).mockRejectedValue(conflictError);

      await register(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(conflictError);
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = { email: 'test@example.com' }; // Missing password, fullName, role

      const validationError = new ValidationError('Missing required fields');
      (authService.registerUser as jest.Mock).mockRejectedValue(validationError);

      await register(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should reject invalid country code', async () => {
      const registerData = UserFactory.createRegisterDTO({ buy_country: 'XX' });
      mockRequest.body = registerData;

      (currencyService.currencyService.validateCountryCode as jest.Mock).mockReturnValue(false);

      await register(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid country code',
          fields: {
            buy_country: ['Country code must be a valid ISO 3166-1 alpha-2 code']
          }
        },
        timestamp: expect.any(String),
      });
      expect(authService.registerUser).not.toHaveBeenCalled();
    });

    it('should reject invalid pincode format', async () => {
      const registerData = UserFactory.createRegisterDTO({ buy_pincode: 'INVALID' });
      mockRequest.body = registerData;

      (currencyService.currencyService.validatePincode as jest.Mock).mockReturnValue(false);

      await register(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pincode format',
          fields: {
            buy_pincode: [`Pincode format is invalid for country ${registerData.buy_country}`]
          }
        },
        timestamp: expect.any(String),
      });
      expect(authService.registerUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return authentication error explaining client-side requirement', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test1234',
      };
      mockRequest.body = loginData;

      const authError = new AuthenticationError(
        'Login must be performed using Firebase Client SDK. ' +
        'The backend verifies tokens, not credentials. ' +
        'Please use the frontend authentication flow.'
      );
      (authService.loginUser as jest.Mock).mockRejectedValue(authError);

      await login(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(authService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle missing credentials', async () => {
      mockRequest.body = { email: 'test@example.com' }; // Missing password

      const validationError = new ValidationError('Password is required');
      (authService.loginUser as jest.Mock).mockRejectedValue(validationError);

      await login(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'user-123';
      mockRequest.userId = userId;

      (authService.logoutUser as jest.Mock).mockResolvedValue(undefined);

      await logout(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(authService.logoutUser).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Logged out successfully',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const userId = 'user-123';
      mockRequest.userId = userId;

      const error = new Error('Failed to revoke tokens');
      (authService.logoutUser as jest.Mock).mockRejectedValue(error);

      await logout(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle missing userId', async () => {
      mockRequest.userId = undefined;

      const validationError = new ValidationError('User ID is required');
      (authService.logoutUser as jest.Mock).mockRejectedValue(validationError);

      await logout(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should return current user profile successfully', async () => {
      const userId = 'user-123';
      const user = UserFactory.create({ id: userId });
      mockRequest.userId = userId;

      (authService.getCurrentUser as jest.Mock).mockResolvedValue(user);

      await getCurrentUserProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(authService.getCurrentUser).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: user,
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      const userId = 'non-existent-user';
      mockRequest.userId = userId;

      const notFoundError = new NotFoundError('User not found');
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(notFoundError);

      await getCurrentUserProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const userId = 'user-123';
      mockRequest.userId = userId;

      const dbError = new Error('Database connection failed');
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(dbError);

      await getCurrentUserProfile(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully with valid token', async () => {
      const token = 'valid-token-123';
      mockRequest.query = { token };

      (verificationService.verifyEmailToken as jest.Mock).mockResolvedValue({ userId: 'user-123', valid: true });

      await verifyEmail(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Email verified successfully',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid or expired token', async () => {
      const token = 'invalid-token';
      mockRequest.query = { token };

      (verificationService.verifyEmailToken as jest.Mock).mockResolvedValue({ userId: 'user-123', valid: false });

      await verifyEmail(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Verification token is invalid or expired. Please request a new verification email.',
        },
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      mockRequest.query = {};

      await verifyEmail(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Verification token is required',
        },
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle verification service errors', async () => {
      const token = 'valid-token-123';
      mockRequest.query = { token };

      (verificationService.verifyEmailToken as jest.Mock).mockRejectedValue(new Error('Database error'));

      await verifyEmail(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      const email = 'test@example.com';
      mockRequest.body = { email };

      (verificationService.resendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      await resendVerification(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Verification email sent',
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing email', async () => {
      mockRequest.body = {};

      await resendVerification(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user not found error', async () => {
      const email = 'nonexistent@example.com';
      mockRequest.body = { email };

      (verificationService.resendVerificationEmail as jest.Mock).mockRejectedValue(new NotFoundError('User not found'));

      await resendVerification(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should handle already verified email', async () => {
      const email = 'verified@example.com';
      mockRequest.body = { email };

      (verificationService.resendVerificationEmail as jest.Mock).mockRejectedValue(new ValidationError('Email is already verified'));

      await resendVerification(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for authenticated user', async () => {
      const userId = 'user-123';
      mockRequest.userId = userId;

      (verificationService.isEmailVerified as jest.Mock).mockResolvedValue(true);

      await getVerificationStatus(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          emailVerified: true,
        },
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return false for unverified user', async () => {
      const userId = 'user-123';
      mockRequest.userId = userId;

      (verificationService.isEmailVerified as jest.Mock).mockResolvedValue(false);

      await getVerificationStatus(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          emailVerified: false,
        },
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user not found error', async () => {
      const userId = 'non-existent-user';
      mockRequest.userId = userId;

      (verificationService.isEmailVerified as jest.Mock).mockRejectedValue(new NotFoundError('User not found'));

      await getVerificationStatus(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
