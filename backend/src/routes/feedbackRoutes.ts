import { Router } from 'express';
import { submitFeedback, getFeedbackByListing, getAverageRating } from '../controllers/feedbackController';
import { authenticate } from '../middleware/auth';
import { attachUserRole, requireBuyer } from '../middleware/rbac';
import { validate, submitFeedbackSchema } from '../validators/feedbackValidator';

const router = Router();

router.post('/', authenticate, attachUserRole, requireBuyer, validate(submitFeedbackSchema), submitFeedback);
router.get('/listing/:id', getFeedbackByListing);
router.get('/listing/:id/rating', getAverageRating);

export default router;
