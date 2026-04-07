import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createConversation, sendMessage, getConversation } from '../controllers/aiSupportController';

const router = Router();

// All AI support routes require authentication (buyers and sellers)
router.use(authenticate);

router.post('/conversation', createConversation);
router.post('/message', sendMessage);
router.get('/conversation/:id', getConversation);

export default router;
