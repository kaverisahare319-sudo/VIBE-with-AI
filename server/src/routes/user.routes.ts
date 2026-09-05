import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { getAnalytics } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/user/onboarding
router.post('/onboarding', authenticate, userController.submitOnboarding.bind(userController));

// GET /api/user/analytics
router.get('/analytics', authenticate, getAnalytics);

export default router;
