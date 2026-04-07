import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ValidationError } from './errorHandler';
import { logger } from '../utils/logger';
import verificationService from '../services/verificationService';

/**
 * CAPTCHA validation middleware factory
 * Creates middleware that validates CAPTCHA tokens for specific actions
 * 
 * Requirements: 19.3, 19.4
 * 
 * @param action - The action being performed (e.g., 'register', 'login')
 * @returns Express middleware function
 * 
 * @example
 * router.post('/register', validateCaptcha('register'), registerController);
 */
export const validateCaptcha = (action: string) => {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract CAPTCHA token from request body
      const { captchaToken } = req.body;

      // Check if token is provided
      if (!captchaToken) {
        logger.warn('CAPTCHA token missing', {
          action,
          path: req.path,
          method: req.method,
        });
        throw new ValidationError('CAPTCHA token is required');
      }

      // Development bypass: Accept mock tokens in development mode
      if (process.env.NODE_ENV === 'development' && captchaToken.startsWith('dev_mock_token_')) {
        logger.warn('⚠️ CAPTCHA validation bypassed in development mode', {
          action,
          path: req.path,
          method: req.method,
        });
        return next();
      }

      // Validate CAPTCHA token with verification service
      const isValid = await verificationService.validateCaptcha(captchaToken, action);

      if (!isValid) {
        logger.warn('CAPTCHA validation failed', {
          action,
          path: req.path,
          method: req.method,
        });
        throw new ValidationError('CAPTCHA validation failed');
      }

      logger.info('CAPTCHA validation successful', {
        action,
        path: req.path,
        method: req.method,
      });

      // CAPTCHA is valid, proceed to next middleware
      next();
    } catch (error: any) {
      // Pass through known validation errors
      if (error instanceof ValidationError) {
        return next(error);
      }

      // Log unexpected errors
      logger.error('Error validating CAPTCHA', {
        error: error.message,
        stack: error.stack,
        action,
        path: req.path,
        method: req.method,
      });

      // Return generic validation error for unexpected cases
      next(new ValidationError('CAPTCHA validation failed'));
    }
  };
};
