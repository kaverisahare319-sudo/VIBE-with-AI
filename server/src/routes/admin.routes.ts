import { Router } from 'express';
import {
  adminLogin,
  getAdminStats,
  listGDRequests,
  approveGDRequest,
  rejectGDRequest,
  rescheduleGDRequest,
  listUsers,
} from '../controllers/admin.auth.controller';
import { adminAuthenticate } from '../middleware/admin.middleware';

const router = Router();

// Public: Admin login (no auth required)
router.post('/login', adminLogin);

// Protected: All routes below require admin JWT
router.get('/stats', adminAuthenticate, getAdminStats);
router.get('/users', adminAuthenticate, listUsers);
router.get('/gd-requests', adminAuthenticate, listGDRequests);
router.put('/gd-requests/:id/approve', adminAuthenticate, approveGDRequest);
router.put('/gd-requests/:id/reject', adminAuthenticate, rejectGDRequest);
router.put('/gd-requests/:id/reschedule', adminAuthenticate, rescheduleGDRequest);

export default router;

