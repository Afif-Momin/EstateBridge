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
   */
  async getRegions(): Promise<Region[]> {
    const regions = await regionRepository.findAllActive();

    logWithContext('info', 'Fetched active regions', { count: regions.length });

    return regions;
  }
}

export default new RegionService();
