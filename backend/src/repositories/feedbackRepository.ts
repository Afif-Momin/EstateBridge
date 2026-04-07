import { getFirebaseFirestore } from '../config/firebase';
import { Feedback } from '../types';
import { DatabaseError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { COLLECTIONS } from '../constants';

export interface CreateFeedbackData {
  listingId: string;
  buyerId: string;
  rating: number;
  comment: string;
}

class FeedbackRepository {
  private collectionName = COLLECTIONS.FEEDBACK;

  /**
   * Create a new feedback entry
   */
  async create(data: CreateFeedbackData): Promise<Feedback> {
    try {
      const db = getFirebaseFirestore();
      const ref = db.collection(this.collectionName).doc();
      const now = new Date();

      const feedbackData = { ...data, createdAt: now };
      await ref.set(feedbackData);

      logWithContext('info', 'Feedback created', { feedbackId: ref.id });

      return { id: ref.id, ...feedbackData };
    } catch (error) {
      logWithContext('error', 'Error creating feedback', { error });
      throw new DatabaseError('Failed to create feedback');
    }
  }

  /**
   * Find all feedback for a listing, ordered by newest first
   */
  async findByListing(listingId: string): Promise<Feedback[]> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('listingId', '==', listingId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
        } as Feedback;
      });
    } catch (error) {
      logWithContext('error', 'Error fetching feedback by listing', { error, listingId });
      throw new DatabaseError('Failed to retrieve feedback');
    }
  }

  /**
   * Check if a buyer has already submitted feedback for a listing
   */
  async checkExisting(buyerId: string, listingId: string): Promise<boolean> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('buyerId', '==', buyerId)
        .where('listingId', '==', listingId)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logWithContext('error', 'Error checking existing feedback', { error });
      throw new DatabaseError('Failed to check existing feedback');
    }
  }

  /**
   * Calculate average rating for a listing
   */
  async getAverageRating(listingId: string): Promise<{ average: number; count: number }> {
    try {
      const feedbackList = await this.findByListing(listingId);

      if (feedbackList.length === 0) {
        return { average: 0, count: 0 };
      }

      const sum = feedbackList.reduce((acc, f) => acc + f.rating, 0);
      const average = Math.round((sum / feedbackList.length) * 10) / 10; // 1 decimal place

      return { average, count: feedbackList.length };
    } catch (error) {
      logWithContext('error', 'Error calculating average rating', { error, listingId });
      throw new DatabaseError('Failed to calculate average rating');
    }
  }
}

export default new FeedbackRepository();
