import { Router } from 'express';
import { submitGDRequest, getUserGDRequests, getGDTopics, completeGDRequest, getGDRequestById } from '../controllers/gd.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public: Fetch dynamic topics
router.get('/topics', getGDTopics);

// Protected: User submits a Live GD request
router.post('/request', authenticate, submitGDRequest);
router.get('/my-requests', authenticate, getUserGDRequests);
router.get('/request/:id', authenticate, getGDRequestById);
router.post('/request/:id/complete', authenticate, completeGDRequest);

export default router;
