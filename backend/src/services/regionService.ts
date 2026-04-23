import regionRepository from '../repositories/regionRepository';
import { Region } from '../types';
import { logWithContext } from '../utils/logger';

/**
 * Region Service
 * Handles business logic for region management
 */
class RegionService {
  /**
   * Get all active regions
   * Derives regions from actual properties in the database
   */
  async getRegions(): Promise<Region[]> {
    const regions = await regionRepository.findAllActive();

    // If no regions in the regions collection, derive from properties
    if (regions.length === 0) {
      const derivedRegions = await regionRepository.findFromProperties();
      logWithContext('info', 'Fetched regions from properties', { count: derivedRegions.length });
      return derivedRegions;
    }

    logWithContext('info', 'Fetched active regions', { count: regions.length });

    return regions;
  }
}

export default new RegionService();
