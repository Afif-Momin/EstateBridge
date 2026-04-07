import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireSeller, requireBuyer } from '../middleware/rbac';
import { getSellerDashboard, getBuyerDashboard } from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

router.get('/seller', requireSeller, getSellerDashboard);
router.get('/buyer', requireBuyer, getBuyerDashboard);

export default router;
