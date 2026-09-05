import { Router } from 'express';
import multer from 'multer';
import { analyzeResume, validateResume } from '../controllers/resume.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Resume endpoints — no auth required (public ATS tool)
router.post('/validate', upload.single('resume'), validateResume);
router.post('/analyze',  upload.single('resume'), analyzeResume);

export default router;
