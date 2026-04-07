import { getFirebaseFirestore } from '../config/firebase';
import { RateLimitEntry, RateLimitResourceType } from '../types';
import { DatabaseError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { COLLECTIONS } from '../constants';

export interface CreateRateLimitData {
  userId?: string;
  ipAddress?: string;
  resourceType: RateLimitResourceType;
  resourceId?: string;
  count: number;
  windowStart: Date;
  windowEnd: Date;
}

class RateLimitRepository {
  private collectionName = COLLECTIONS.RATE_LIMITS;

  /**
   * Find rate limit entry by user ID and resource type
   * Used for property_creation and appointment_request rate limits
   */
  async findByUserAndType(
    userId: string,
    resourceType: RateLimitResourceType,
    resourceId?: string
  ): Promise<RateLimitEntry | null> {
    try {
      const db = getFirebaseFirestore();
      let query = db
        .collection(this.collectionName)
        .where('userId', '==', userId)
        .where('resourceType', '==', resourceType);

      // For appointment requests, also filter by propertyId
      if (resourceId) {
        query = query.where('resourceId', '==', resourceId);
      }

      const snapshot = await query
        .where('windowEnd', '>', new Date())
        .orderBy('windowEnd', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        windowStart: data.windowStart?.toDate(),
        windowEnd: data.windowEnd?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as RateLimitEntry;
    } catch (error) {
      logWithContext('error', 'Error finding rate limit by user and type', { 
        error, 
        userId, 
        resourceType,
        resourceId 
      });
      throw new DatabaseError('Failed to retrieve rate limit entry');
    }
  }

  /**
   * Find rate limit entry by IP address
   * Used for registration rate limiting
   */
  async findByIP(
    ipAddress: string,
    resourceType: RateLimitResourceType
  ): Promise<RateLimitEntry | null> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('ipAddress', '==', ipAddress)
        .where('resourceType', '==', resourceType)
        .where('windowEnd', '>', new Date())
        .orderBy('windowEnd', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        windowStart: data.windowStart?.toDate(),
        windowEnd: data.windowEnd?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as RateLimitEntry;
    } catch (error) {
      logWithContext('error', 'Error finding rate limit by IP', { 
        error, 
        ipAddress, 
        resourceType 
      });
      throw new DatabaseError('Failed to retrieve rate limit entry');
    }
  }

  /**
   * Increment the count for an existing rate limit entry
   * or create a new one if it doesn't exist
   */
  async incrementCount(
    data: CreateRateLimitData
  ): Promise<RateLimitEntry> {
    try {
      const db = getFirebaseFirestore();
      
      // Try to find existing entry
      let existingEntry: RateLimitEntry | null = null;
      
      if (data.userId) {
        existingEntry = await this.findByUserAndType(
          data.userId,
          data.resourceType,
          data.resourceId
        );
      } else if (data.ipAddress) {
        existingEntry = await this.findByIP(data.ipAddress, data.resourceType);
      }

      const now = new Date();

      if (existingEntry) {
        // Update existing entry
        const ref = db.collection(this.collectionName).doc(existingEntry.id);
        const updateData = {
          count: existingEntry.count + 1,
          updatedAt: now,
        };

        await ref.update(updateData);

        logWithContext('info', 'Rate limit count incremented', { 
          entryId: existingEntry.id,
          newCount: existingEntry.count + 1,
          resourceType: data.resourceType
        });

        return {
          ...existingEntry,
          count: existingEntry.count + 1,
          updatedAt: now,
        };
      } else {
        // Create new entry
        const ref = db.collection(this.collectionName).doc();
        const entryData = {
          ...data,
          createdAt: now,
          updatedAt: now,
        };

        await ref.set(entryData);

        logWithContext('info', 'Rate limit entry created', { 
          entryId: ref.id,
          resourceType: data.resourceType
        });

        return { id: ref.id, ...entryData };
      }
    } catch (error) {
      logWithContext('error', 'Error incrementing rate limit count', { error, data });
      throw new DatabaseError('Failed to update rate limit entry');
    }
  }

  /**
   * Reset the count for a rate limit entry
   * Used when the time window expires or needs to be manually reset
   */
  async resetCount(entryId: string): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      const ref = db.collection(this.collectionName).doc(entryId);

      const doc = await ref.get();
      if (!doc.exists) {
        logWithContext('warn', 'Rate limit entry not found for reset', { entryId });
        return;
      }

      await ref.delete();

      logWithContext('info', 'Rate limit entry reset (deleted)', { entryId });
    } catch (error) {
      logWithContext('error', 'Error resetting rate limit count', { error, entryId });
      throw new DatabaseError('Failed to reset rate limit entry');
    }
  }

  /**
   * Delete expired rate limit entries
   * Returns the count of deleted entries
   */
  async deleteExpired(): Promise<number> {
    try {
      const db = getFirebaseFirestore();
      const now = new Date();

      const snapshot = await db
        .collection(this.collectionName)
        .where('windowEnd', '<', now)
        .get();

      if (snapshot.empty) {
        logWithContext('info', 'No expired rate limit entries to delete');
        return 0;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      const deletedCount = snapshot.size;
      logWithContext('info', 'Expired rate limit entries deleted', { count: deletedCount });

      return deletedCount;
    } catch (error) {
      logWithContext('error', 'Error deleting expired rate limit entries', { error });
      throw new DatabaseError('Failed to delete expired rate limit entries');
    }
  }
}

export default new RateLimitRepository();
