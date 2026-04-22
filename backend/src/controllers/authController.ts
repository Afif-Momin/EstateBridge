import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from '../services/authService';
import { currencyService } from '../services/currencyService';
import verificationService from '../services/verificationService';
import { logger } from '../utils/logger';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      fullName, 
      role, 
      idToken,
      buy_country,
      buy_city,
      buy_state,
      buy_address,
      buy_pincode
    } = req.body;

    logger.info('Registration attempt', { email, role, country: buy_country });

    // Validate country code (Requirements 1.3)
    if (!currencyService.validateCountryCode(buy_country)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid country code',
          fields: {
            buy_country: ['Country code must be a valid ISO 3166-1 alpha-2 code']
          }
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate pincode format for the country (Requirements 1.4)
    if (!currencyService.validatePincode(buy_pincode, buy_country)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pincode format',
          fields: {
            buy_pincode: [`Pincode format is invalid for country ${buy_country}`]
          }
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Determine currency based on country (Requirements 2.1, 2.2)
    const currency = currencyService.determineCurrency(buy_country);

    const result = await registerUser({
      email,
      password: password || '',
      fullName,
      role,
      idToken,
      buy_country,
      buy_city,
      buy_state,
      buy_address,
      buy_pincode,
      currency,
    });

    logger.info('User registered successfully', {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      country: buy_country,
      currency,
    });

    // Send verification email — fire-and-forget so it doesn't block the response
    verificationService.generateVerificationToken(result.user.id)
      .then((token) => verificationService.sendVerificationEmail(email, token))
      .then(() => logger.info('Verification email sent', { email }))
      .catch((err) => logger.warn('Failed to send verification email (non-fatal)', { email, error: err?.message }));

    res.status(201).json({
      success: true,
      data: { user: result.user },
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 * 
 * Note: This endpoint documents that login must be performed using Firebase Client SDK.
 * The backend's role is to verify tokens, not credentials.
 */
export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    logger.info('Login attempt', { email });

    // This will throw an AuthenticationError explaining the correct approach
    await loginUser(req.body);

    // This line will never be reached
    res.status(200).json({
      success: true,
      data: null,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 * Requires authentication
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    logger.info('Logout attempt', { userId });

    await logoutUser(userId);

    logger.info('User logged out successfully', { userId });

    res.status(200).json({
      success: true,
      data: null,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 * Requires authentication
 */
export const getCurrentUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    logger.info('Get current user request', { userId });

    const user = await getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email with token
 * GET /api/v1/auth/verify-email?token={token}
 */
export const verifyEmail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Verification token is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info('Email verification attempt', { token: token.substring(0, 8) + '...' });

    const result = await verificationService.verifyEmailToken(token);

    if (!result.valid) {
      // Token is invalid or expired
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Verification token is invalid or expired. Please request a new verification email.',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info('Email verified successfully', { userId: result.userId });

    res.status(200).json({
      success: true,
      data: null,
      message: 'Email verified successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
export const resendVerification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info('Resend verification email request', { email });

    await verificationService.resendVerificationEmail(email);

    logger.info('Verification email resent successfully', { email });

    res.status(200).json({
      success: true,
      data: null,
      message: 'Verification email sent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get email verification status
 * GET /api/v1/auth/verification-status
 * Requires authentication
 */
export const getVerificationStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    logger.info('Get verification status request', { userId });

    const emailVerified = await verificationService.isEmailVerified(userId);

    res.status(200).json({
      success: true,
      data: {
        emailVerified,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
