import { Response, NextFunction } from 'express';
import { getFirebaseFirestore } from '../config/firebase';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

/**
 * Middleware to check if user's email is verified
 * Must be used after authenticate middleware
 * Returns 401 error if email is not verified
 * 
 * Requirements: 4.3, 4.4, 15.3
 */
export const requireEmailVerified = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.userId) {
      throw new AuthenticationError('User must be authenticated to access this resource');
    }

    // Fetch user profile from Firestore
    const db = getFirebaseFirestore();
    
    // Check both buyers and sellers collections
    const buyerDoc = await db.collection('buyers').doc(req.userId).get();
    const sellerDoc = await db.collection('sellers').doc(req.userId).get();

    let emailVerified = false;

    if (buyerDoc.exists) {
      const buyerData = buyerDoc.data();
      emailVerified = buyerData?.emailVerified === true;
    } else if (sellerDoc.exists) {
      const sellerData = sellerDoc.data();
      emailVerified = sellerData?.emailVerified === true;
    } else {
      logger.warn('User profile not found in Firestore', {
        userId: req.userId,
        path: req.path,
        method: req.method,
      });
      throw new AuthenticationError('User profile not found');
    }

    // Check if email is verified
    if (!emailVerified) {
      logger.warn('Email verification required', {
        userId: req.userId,
        path: req.path,
        method: req.method,
      });
      throw new AuthorizationError('Email verification required. Please verify your email before creating properties.');
    }

    logger.debug('Email verification check passed', {
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    // Pass through known errors
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return next(error);
    }

    // Log unexpected errors
    logger.error('Error checking email verification', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    next(new AuthorizationError('Failed to verify email verification status'));
  }
};
