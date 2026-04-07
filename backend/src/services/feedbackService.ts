import feedbackRepository, { CreateFeedbackData } from '../repositories/feedbackRepository';
import { Feedback } from '../types';
import { ValidationError, ConflictError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { VALIDATION } from '../constants';

class FeedbackService {
  /**
   * Submit feedback for a listing (buyer only, one per listing)
   */
  async submitFeedback(
    data: Omit<CreateFeedbackData, 'buyerId'>,
    buyerId: string
  ): Promise<Feedback> {
    // Validate rating
    if (
      !Number.isInteger(data.rating) ||
      data.rating < VALIDATION.RATING_MIN ||
      data.rating > VALIDATION.RATING_MAX
    ) {
      throw new ValidationError(
        `Rating must be an integer between ${VALIDATION.RATING_MIN} and ${VALIDATION.RATING_MAX}`
      );
    }

    // Validate comment length
    if (data.comment.length < VALIDATION.FEEDBACK_COMMENT_MIN_LENGTH) {
      throw new ValidationError(
        `Comment must be at least ${VALIDATION.FEEDBACK_COMMENT_MIN_LENGTH} characters`
      );
    }
    if (data.comment.length > VALIDATION.FEEDBACK_COMMENT_MAX_LENGTH) {
      throw new ValidationError(
        `Comment must not exceed ${VALIDATION.FEEDBACK_COMMENT_MAX_LENGTH} characters`
      );
    }

    // Prevent duplicate feedback
    const exists = await feedbackRepository.checkExisting(buyerId, data.listingId);
    if (exists) {
      throw new ConflictError(
        'You have already submitted feedback for this property',
        'FEEDBACK_ALREADY_SUBMITTED'
      );
    }

    const feedback = await feedbackRepository.create({ ...data, buyerId });

    logWithContext('info', 'Feedback submitted', {
      feedbackId: feedback.id,
      buyerId,
      listingId: data.listingId,
      rating: data.rating,
    });

    return feedback;
  }

  /**
   * Get all feedback for a listing
   */
  async getFeedbackByListing(listingId: string): Promise<Feedback[]> {
    return feedbackRepository.findByListing(listingId);
  }

  /**
   * Get average rating for a listing
   */
  async getAverageRating(
    listingId: string
  ): Promise<{ average: number; count: number }> {
    return feedbackRepository.getAverageRating(listingId);
  }
}

export default new FeedbackService();
