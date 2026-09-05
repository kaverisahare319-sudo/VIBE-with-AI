import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import ResumeAnalysis from '../models/ResumeAnalysis';
import { ResumeService } from '../services/resume.service';

// ── Text extraction helper ───────────────────────────────────────
const extractText = async (file: Express.Multer.File): Promise<string> => {
  try {
    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer);
      return pdfData.text;
    } else if (
      file.originalname.endsWith('.docx') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } else {
      return file.buffer.toString('utf8');
    }
  } catch (err) {
    console.error('[Resume] Text extraction error:', err);
    return '';
  }
};

// ── Validate ─────────────────────────────────────────────────────
export const validateResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ isValid: false, confidenceScore: 0, message: 'No file uploaded.' });
    }
    const text = await extractText(req.file);
    const result = ResumeService.validateResume(req.file.originalname, text);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Resume] Validation error:', error);
    return res.status(500).json({ isValid: false, confidenceScore: 0, message: 'Server error during validation.' });
  }
};

// ── Analyze ──────────────────────────────────────────────────────
export const analyzeResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required.' });
    }

    const text = await extractText(req.file);
    if (text.length < 50) {
      return res.status(400).json({ error: 'Insufficient text extracted from resume.' });
    }

    // targetRole comes from FormData field (optional)
    const targetRole: string | undefined = req.body?.targetRole || undefined;

    // Run deterministic role-aware analysis
    const result = ResumeService.analyzeResume(req.file.originalname, text, targetRole);

    // Optionally save analytics to DB if user is authenticated
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (userId) {
      try {
        const record = new ResumeAnalysis({
          userId,
          resumeText: text.slice(0, 2000),
          atsScore: result.score,
          impactScore: result.contentQualityScore,
          brevityScore: result.readabilityScore,
          missingKeywords: result.missingKeywords,
          formattingIssues: result.weaknesses,
          bulletPointFeedback: result.suggestions,
          overallFeedback: result.strengths[0] || 'Good baseline.',
        });
        await record.save();
      } catch (dbErr) {
        // Non-fatal — analytics save failure shouldn't block the response
        console.warn('[Resume] DB save skipped:', dbErr);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Resume] Analysis error:', error);
    return res.status(500).json({ error: 'Internal server error during analysis.' });
  }
};
