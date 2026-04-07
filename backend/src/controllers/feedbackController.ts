import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import feedbackService from '../services/feedbackService';
import { logger } from '../utils/logger';

/**
 * POST /api/v1/feedback
 * Submit feedback for a listing (buyer only)
 */
export const submitFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const buyerId = req.userId!;
    const { listingId, rating, comment } = req.body;

    const feedback = await feedbackService.submitFeedback(
      { listingId, rating, comment },
      buyerId
    );

    logger.info('Feedback submitted', { feedbackId: feedback.id, buyerId });

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/feedback/listing/:id
 * Get all feedback for a listing (public)
 */
export const getFeedbackByListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const feedbackList = await feedbackService.getFeedbackByListing(id);

    res.status(200).json({
      success: true,
      data: feedbackList,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/feedback/listing/:id/rating
 * Get average rating for a listing (public)
 */
export const getAverageRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const ratingData = await feedbackService.getAverageRating(id);

    res.status(200).json({
      success: true,
      data: ratingData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
