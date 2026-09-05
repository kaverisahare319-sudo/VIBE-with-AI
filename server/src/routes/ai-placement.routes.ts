import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { saveAssessment, getAssessments, generateQuestion, evaluateInterview } from '../controllers/ai-placement.controller';

const router = express.Router();

// All routes require user to be authenticated
router.use(authenticate);

// Generate next interview question
router.post('/question', generateQuestion);

// Evaluate full transcript
router.post('/evaluate', evaluateInterview);

// Save a new AI Placement Assessment result
router.post('/save', saveAssessment);

// Get all past AI Placement Assessments for the user
router.get('/history', getAssessments);

export default router;
