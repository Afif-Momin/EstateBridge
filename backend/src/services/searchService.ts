import propertyRepository from '../repositories/propertyRepository';
import { SearchFilters, PaginatedResponse, Property } from '../types';
import { ValidationError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { PAGINATION } from '../constants';

/**
 * Search Service
 * Orchestrates property search and filtering logic
 */
class SearchService {
  /**
   * Search properties with multiple filter support
   */
  async searchProperties(
    filters: SearchFilters,
    userId?: string
  ): Promise<PaginatedResponse<Property>> {
    // Validate price range
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      throw new ValidationError('minPrice cannot be greater than maxPrice');
    }

    if (filters.minPrice !== undefined && filters.minPrice < 0) {
      throw new ValidationError('minPrice must be a non-negative number');
    }

    if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
      throw new ValidationError('maxPrice must be a non-negative number');
    }

    // Clamp pagination
    const page = Math.max(1, filters.page ?? PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, filters.limit ?? PAGINATION.DEFAULT_LIMIT)
    );

    const result = await propertyRepository.search({ ...filters, page, limit }, userId);

    logWithContext('info', 'Property search completed', {
      filters,
      resultCount: result.data.length,
      total: result.pagination.total,
    });

    return result;
  }

  /**
   * Get all available properties (status = 'available')
   */
  async getAvailableProperties(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<PaginatedResponse<Property>> {
    const clampedLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));
    const clampedPage = Math.max(1, page);

    return propertyRepository.getAvailableProperties(clampedPage, clampedLimit);
  }
}

export default new SearchService();
