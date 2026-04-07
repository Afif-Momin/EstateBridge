import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { AuthenticationError } from './errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

/**
 * Authentication middleware that verifies Firebase Auth tokens
 * Extracts Bearer token from Authorization header and verifies it
 * Attaches userId and userEmail to request object
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('Authorization header is required');
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization format. Expected: Bearer <token>');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.trim() === '') {
      throw new AuthenticationError('Token is required');
    }

    // Verify token with Firebase Admin Auth
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user information to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.userId = decodedToken.uid;
    authenticatedReq.userEmail = decodedToken.email;

    logger.info('User authenticated', {
      userId: decodedToken.uid,
      email: decodedToken.email,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    // Handle Firebase Auth specific errors
    if (error.code === 'auth/id-token-expired') {
      logger.warn('Token expired', {
        path: req.path,
        method: req.method,
      });
      return next(new AuthenticationError('Token has expired'));
    }

    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      logger.warn('Invalid token', {
        path: req.path,
        method: req.method,
        error: error.message,
      });
      return next(new AuthenticationError('Invalid token'));
    }

    // If it's already an AuthenticationError, pass it through
    if (error instanceof AuthenticationError) {
      return next(error);
    }

    // Log unexpected errors
    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });

    // Generic authentication error for unexpected cases
    next(new AuthenticationError('Authentication failed'));
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 * Useful for routes that work with or without authentication
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    // If token is empty, continue without authentication
    if (!token || token.trim() === '') {
      return next();
    }

    // Try to verify token
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user information to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.userId = decodedToken.uid;
    authenticatedReq.userEmail = decodedToken.email;

    logger.info('User optionally authenticated', {
      userId: decodedToken.uid,
      email: decodedToken.email,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    // For optional auth, log the error but continue without authentication
    logger.debug('Optional authentication failed', {
      error: error.message,
      path: req.path,
      method: req.method,
    });

    next();
  }
};
