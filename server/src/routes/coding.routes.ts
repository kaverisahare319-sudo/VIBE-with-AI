import { Router } from 'express';
import { evaluateCode, getJobStatus } from '../controllers/coding.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/coding/evaluate  — submit code, get back jobId immediately
router.post('/evaluate', authenticate, evaluateCode);

// GET /api/coding/status/:jobId  — poll for progress & final result
router.get('/status/:jobId', authenticate, getJobStatus);

export default router;
