import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { dashboardService } from '../services/dashboardService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/v1/dashboard/seller
 * Seller-only: returns seller dashboard statistics.
 */
export const getSellerDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const sellerId = req.userId!;
    const dashboard = await dashboardService.getSellerDashboard(sellerId);
    sendSuccess(res, dashboard);
  }
);

/**
 * GET /api/v1/dashboard/buyer
 * Buyer-only: returns buyer dashboard statistics.
 */
export const getBuyerDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const buyerId = req.userId!;
    const dashboard = await dashboardService.getBuyerDashboard(buyerId);
    sendSuccess(res, dashboard);
  }
);
