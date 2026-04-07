import { Response, NextFunction } from 'express';
import { getFirebaseFirestore } from '../config/firebase';
import { AuthorizationError, NotFoundError } from './errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * Middleware to attach user role from Firestore to the request object
 * Must be used after authenticate middleware
 */
export const attachUserRole = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.userId) {
      throw new AuthorizationError('User must be authenticated to access this resource');
    }

    // Fetch user profile from Firestore
    const db = getFirebaseFirestore();
    
    // Check both buyers and sellers collections
    const buyerDoc = await db.collection('buyers').doc(req.userId).get();
    const sellerDoc = await db.collection('sellers').doc(req.userId).get();

    let userRole: UserRole | undefined;

    if (buyerDoc.exists) {
      const buyerData = buyerDoc.data();
      userRole = buyerData?.role || 'buyer';
    } else if (sellerDoc.exists) {
      const sellerData = sellerDoc.data();
      userRole = sellerData?.role || 'seller';
    }

    if (!userRole) {
      logger.warn('User profile not found in Firestore', {
        userId: req.userId,
        path: req.path,
        method: req.method,
      });
      throw new NotFoundError('User profile not found');
    }

    // Attach role to request
    req.userRole = userRole;

    logger.debug('User role attached', {
      userId: req.userId,
      role: userRole,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    // Pass through known errors
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      return next(error);
    }

    // Log unexpected errors
    logger.error('Error fetching user role', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    next(new AuthorizationError('Failed to verify user permissions'));
  }
};

/**
 * Middleware to require seller role
 * Must be used after attachUserRole middleware
 */
export const requireSeller = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.userRole) {
      throw new AuthorizationError('User role not found. Ensure attachUserRole middleware is used.');
    }

    if (req.userRole !== 'seller') {
      logger.warn('Seller access denied', {
        userId: req.userId,
        role: req.userRole,
        path: req.path,
        method: req.method,
      });
      throw new AuthorizationError('This resource requires seller role');
    }

    logger.debug('Seller access granted', {
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require buyer role
 * Must be used after attachUserRole middleware
 */
export const requireBuyer = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.userRole) {
      throw new AuthorizationError('User role not found. Ensure attachUserRole middleware is used.');
    }

    if (req.userRole !== 'buyer') {
      logger.warn('Buyer access denied', {
        userId: req.userId,
        role: req.userRole,
        path: req.path,
        method: req.method,
      });
      throw new AuthorizationError('This resource requires buyer role');
    }

    logger.debug('Buyer access granted', {
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generic middleware factory to require a specific role
 * @param role - The required role ('buyer' or 'seller')
 * @returns Middleware function that checks for the specified role
 */
export const requireRole = (role: UserRole) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    try {
      if (!req.userRole) {
        throw new AuthorizationError('User role not found. Ensure attachUserRole middleware is used.');
      }

      if (req.userRole !== role) {
        logger.warn('Role access denied', {
          userId: req.userId,
          requiredRole: role,
          actualRole: req.userRole,
          path: req.path,
          method: req.method,
        });
        throw new AuthorizationError(`This resource requires ${role} role`);
      }

      logger.debug('Role access granted', {
        userId: req.userId,
        role: role,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require admin role
 * Must be used after attachUserRole middleware
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.userRole) {
      throw new AuthorizationError('User role not found. Ensure attachUserRole middleware is used.');
    }

    if (req.userRole !== 'admin') {
      logger.warn('Admin access denied', {
        userId: req.userId,
        role: req.userRole,
        path: req.path,
        method: req.method,
      });
      throw new AuthorizationError('This resource requires admin role');
    }

    logger.debug('Admin access granted', {
      userId: req.userId,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    next(error);
  }
};
