import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware to add a unique request ID to each request
 * This helps with request tracking and correlation in logs
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate a unique request ID
  req.requestId = randomUUID();
  
  // Add request ID to response headers for client-side tracking
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};
