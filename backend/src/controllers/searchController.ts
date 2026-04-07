import { Request, Response, NextFunction } from 'express';
import searchService from '../services/searchService';
import regionService from '../services/regionService';
import { SearchFilters, PropertyStatus, PropertyType, AuthenticatedRequest } from '../types';
import { PAGINATION } from '../constants';

/**
 * GET /api/v1/search/properties
 * Search properties with optional filters
 * Query params: region, minPrice, maxPrice, propertyType, keyword, status,
 *               page, limit, sortBy, sortOrder
 */
export const searchProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      region,
      minPrice,
      maxPrice,
      propertyType,
      keyword,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string | undefined>;

    const filters: SearchFilters = {
      region: region || undefined,
      minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
      propertyType: propertyType as PropertyType | undefined,
      keyword: keyword || undefined,
      status: status as PropertyStatus | undefined,
      page: page ? Math.max(1, parseInt(page)) : PAGINATION.DEFAULT_PAGE,
      limit: limit
        ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit)))
        : PAGINATION.DEFAULT_LIMIT,
      sortBy: (sortBy as 'price' | 'createdAt') || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Pass userId if authenticated (to allow owners to see their pending properties)
    const userId = (req as AuthenticatedRequest).userId;
    const result = await searchService.searchProperties(filters, userId);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/search/regions
 * Get all active regions
 */
export const getRegions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const regions = await regionService.getRegions();

    res.status(200).json({
      success: true,
      data: regions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
