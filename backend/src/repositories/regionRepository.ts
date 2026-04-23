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
   * Get all active regions from the regions collection
   * Uses only a where filter (no orderBy) to avoid composite index requirements
   */
  async findAllActive(): Promise<Region[]> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('active', '==', true)
        .get();

      const regions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Region, 'id'>),
      }));

      // Sort in-memory to avoid composite index requirement
      return regions.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } catch (error) {
      logWithContext('error', 'Error fetching regions', { error });
      // Return empty array instead of throwing — caller will fall back to property-derived regions
      return [];
    }
  }

  /**
   * Derive unique regions from existing properties in the database
   * This is the fallback when the regions collection is empty
   */
  async findFromProperties(): Promise<Region[]> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db.collection(COLLECTIONS.PROPERTIES).get();

      const regionSet = new Set<string>();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.region && typeof data.region === 'string') {
          regionSet.add(data.region);
        }
      });

      const regions: Region[] = Array.from(regionSet)
        .sort()
        .map((name) => ({
          id: name,
          name,
          displayName: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
          active: true,
        }));

      return regions;
    } catch (error) {
      logWithContext('error', 'Error deriving regions from properties', { error });
      return [];
    }
  }

  /**
   * Get all regions (including inactive)
   */
  async findAll(): Promise<Region[]> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db.collection(this.collectionName).get();

      const regions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Region, 'id'>),
      }));

      return regions.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } catch (error) {
      logWithContext('error', 'Error fetching all regions', { error });
      throw new DatabaseError('Failed to retrieve regions');
    }
  }
}

export default new RegionRepository();
