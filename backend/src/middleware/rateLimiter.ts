import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ValidationError, AuthenticationError, RateLimitError } from './errorHandler';
import { logger } from '../utils/logger';
import rateLimitingService from '../services/rateLimitingService';

/**
 * Rate limiting middleware for registration attempts
 * Checks IP-based rate limit before allowing registration
 * Requirements: 3.4, 3.5
 */
export const registrationRateLimiter = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract IP address from request
    // Try x-forwarded-for header first (for proxied requests), then fall back to req.ip
    const ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
      req.ip || 
      'unknown';

    if (ipAddress === 'unknown') {
      logger.warn('Unable to determine IP address for rate limiting', {
        path: req.path,
        method: req.method,
      });
    }

    // Check rate limit
    const result = await rateLimitingService.checkRegistrationRateLimit(ipAddress);

    if (!result.allowed) {
      logger.warn('Registration rate limit exceeded', {
        ipAddress,
        resetAt: result.resetAt,
        path: req.path,
        method: req.method,
      });

      throw new RateLimitError(
        `Registration rate limit exceeded. Please try again after ${result.resetAt?.toISOString()}`,
        {
          resetAt: result.resetAt?.toISOString(),
          remaining: result.remaining,
        }
      );
    }

    logger.debug('Registration rate limit check passed', {
      ipAddress,
      remaining: result.remaining,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    // Pass through known validation errors
    if (error instanceof RateLimitError || error instanceof ValidationError) {
      return next(error);
    }

    // Log unexpected errors
    logger.error('Error checking registration rate limit', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });

    // Continue on error to avoid blocking legitimate users
    next();
  }
};

/**
 * Rate limiting middleware for property creation
 * Checks user-based rate limit before allowing property creation
 * Requires authenticated user
 * Requirements: 5.1, 5.2
 */
export const propertyCreationRateLimiter = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.userId) {
      throw new AuthenticationError('User must be authenticated to create properties');
    }

    // Check rate limit
    const result = await rateLimitingService.checkPropertyCreationLimit(req.userId);

    if (!result.allowed) {
      logger.warn('Property creation rate limit exceeded', {
        userId: req.userId,
        resetAt: result.resetAt,
        path: req.path,
        method: req.method,
      });

      throw new RateLimitError(
        `Property creation rate limit exceeded. You can create ${result.remaining} more properties. Limit resets at ${result.resetAt?.toISOString()}`,
        {
          resetAt: result.resetAt?.toISOString(),
          remaining: result.remaining,
        }
      );
    }

    logger.debug('Property creation rate limit check passed', {
      userId: req.userId,
      remaining: result.remaining,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    // Pass through known errors
    if (error instanceof RateLimitError || error instanceof ValidationError || error instanceof AuthenticationError) {
      return next(error);
    }

    // Log unexpected errors
    logger.error('Error checking property creation rate limit', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    // Continue on error to avoid blocking legitimate users
    next();
  }
};

/**
 * Rate limiting middleware for appointment requests
 * Checks user+property rate limit before allowing appointment creation
 * Requires authenticated user and propertyId from params or body
 * Requirements: 10.1, 10.2
 */
export const appointmentRequestRateLimiter = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.userId) {
      throw new AuthenticationError('User must be authenticated to request appointments');
    }

    // Extract propertyId from params or body
    const propertyId = req.params.propertyId || req.body.listingId || req.body.propertyId;

    if (!propertyId) {
      throw new ValidationError('Property ID is required for appointment requests');
    }

    // Check rate limit
    const result = await rateLimitingService.checkAppointmentRequestLimit(
      req.userId,
      propertyId
    );

    if (!result.allowed) {
      logger.warn('Appointment request rate limit exceeded', {
        userId: req.userId,
        propertyId,
        path: req.path,
        method: req.method,
      });

      throw new RateLimitError(
        `Appointment request rate limit exceeded. You have reached the maximum number of appointment requests for this property.`,
        {
          remaining: result.remaining,
        }
      );
    }

    logger.debug('Appointment request rate limit check passed', {
      userId: req.userId,
      propertyId,
      remaining: result.remaining,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    // Pass through known errors
    if (error instanceof RateLimitError || error instanceof ValidationError || error instanceof AuthenticationError) {
      return next(error);
    }

    // Log unexpected errors
    logger.error('Error checking appointment request rate limit', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    // Continue on error to avoid blocking legitimate users
    next();
  }
};
