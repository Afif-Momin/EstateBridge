import { getFirebaseFirestore } from '../config/firebase';
import { Region } from '../types';
import { DatabaseError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { COLLECTIONS } from '../constants';

/**
 * Region Repository
 * Handles Firestore operations for the regions collection
 */
class RegionRepository {
  private collectionName = COLLECTIONS.REGIONS;

  /**
   * Get all active regions
   */
  async findAllActive(): Promise<Region[]> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('active', '==', true)
        .orderBy('displayName', 'asc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Region, 'id'>),
      }));
    } catch (error) {
      logWithContext('error', 'Error fetching regions', { error });
      throw new DatabaseError('Failed to retrieve regions');
    }
  }

  /**
   * Get all regions (including inactive)
   */
  async findAll(): Promise<Region[]> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .orderBy('displayName', 'asc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Region, 'id'>),
      }));
    } catch (error) {
      logWithContext('error', 'Error fetching all regions', { error });
      throw new DatabaseError('Failed to retrieve regions');
    }
  }
}

export default new RegionRepository();
