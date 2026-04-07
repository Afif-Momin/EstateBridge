import { Router } from 'express';
import { searchProperties, getRegions } from '../controllers/searchController';

const router = Router();

/**
 * @route   GET /api/v1/search/properties
 * @desc    Search properties with filters (region, price, type, keyword, status)
 * @access  Public
 */
router.get('/properties', searchProperties);

/**
 * @route   GET /api/v1/search/regions
 * @desc    Get all active regions
 * @access  Public
 */
router.get('/regions', getRegions);

export default router;
