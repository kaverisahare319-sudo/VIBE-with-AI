import { Request, Response } from 'express';
import { getTestSuite } from '../services/testcase-generator';
import { runCode, ProgressCallback } from '../services/sandbox-executor';
import CodingSubmission from '../models/CodingSubmission';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

interface Job {
  status: 'running' | 'complete' | 'error';
  processed: number;
  total: number;
  result?: EvalResult;
  error?: string;
  createdAt: number;
}

interface EvalResult {
  passed: number;
  total: number;
  executionMs: number;
  memoryMB: number;
  score: number;
  maxScore: number;
  status: 'correct' | 'partial' | 'wrong' | 'error' | 'tle';
  stdout: string;
  compilationError?: string;
  runtimePercentile: number;
  aiFeedback?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

// In-memory job store — cleaned up after 10 minutes
const jobs = new Map<string, Job>();

function cleanupJobs() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 10 * 60 * 1000) jobs.delete(id);
  }
}

const DIFF_SCORE: Record<string, number> = { Easy: 10, Medium: 15, Hard: 20 };
const DIFF_BY_QUESTION: Record<number, string> = {
  1: 'Easy', 2: 'Easy', 3: 'Medium', 4: 'Medium', 5: 'Hard',
};

async function calcRuntimePercentile(questionId: number, execMs: number, passed: number, total: number): Promise<number> {
  if (passed !== total) return 0; // Only compute percentile for fully correct submissions

  const allCorrect = await CodingSubmission.countDocuments({ questionId, status: 'correct' });
  if (allCorrect === 0) return 100; // First submission

  const faster = await CodingSubmission.countDocuments({ questionId, status: 'correct', executionMs: { $gt: execMs } }); // $gt because smaller execMs is faster, wait, "faster" means larger executionMs in DB than current. So current is smaller. Yes, executionMs > current means they were slower, so current is faster than them.
  
  return Math.max(1, Math.round((faster / allCorrect) * 100));
}

// POST /api/coding/evaluate
export async function evaluateCode(req: Request, res: Response) {
  const { code, lang, questionId, mode = 'submit' } = req.body as { code: string; lang: string; questionId: number; mode: 'run' | 'submit' };
  const userId = (req as any).user?.id || 'anonymous';

  if (!code || !lang || !questionId) {
    return res.status(400).json({ error: 'Missing required fields: code, lang, questionId' });
  }

  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job: Job = {
    status: 'running',
    processed: 0,
    total: 0,
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Return jobId immediately so frontend can start polling
  res.json({ jobId });

  // Run evaluation in background (non-blocking)
  setImmediate(async () => {
    try {
      const suite = getTestSuite(questionId);
      
      // If mode is 'run', only execute basic/sample test cases
      if (mode === 'run') {
        suite.tests = suite.tests.filter(t => t.category === 'basic');
      }

      job.total = suite.tests.length;

      const onProgress: ProgressCallback = (processed, total) => {
        job.processed = processed;
        job.total = total;
      };

      const runResult = await runCode(code, lang, suite, onProgress);

      const difficulty = DIFF_BY_QUESTION[questionId] || 'Medium';
      const maxScore = DIFF_SCORE[difficulty] || 15;
      const { passed, total } = runResult;

      let status: EvalResult['status'];
      let score: number;

      if (runResult.compilationError) {
        status = 'error'; score = 0;
      } else if (runResult.timedOut) {
        status = 'tle'; score = 0;
      } else if (passed === 0) {
        status = 'wrong'; score = 0;
      } else if (passed === total) {
        status = 'correct'; score = maxScore;
      } else {
        status = 'partial'; score = Math.round((passed / total) * maxScore);
      }

      let runtimePercentile = 0;
      let aiFeedback = '';
      let timeComplexity = '';
      let spaceComplexity = '';
      
      // If it's a real submission, evaluate with AI and save to DB
      if (mode === 'submit') {
        try {
          const prompt = `You are an expert technical interviewer evaluating a coding assessment.
Language: ${lang}
Test cases passed: ${passed}/${total}.
Code:
${code}
Provide your evaluation in strictly valid JSON format:
{
  "timeComplexity": "e.g., O(N)",
  "spaceComplexity": "e.g., O(1)",
  "feedback": "Concise feedback on code cleanliness, naming, and hints if tests failed."
}`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
          });
          
          const resultStr = completion.choices[0].message?.content || '{}';
          const aiResult = JSON.parse(resultStr);
          timeComplexity = aiResult.timeComplexity || 'Unknown';
          spaceComplexity = aiResult.spaceComplexity || 'Unknown';
          aiFeedback = aiResult.feedback || 'No feedback generated.';
        } catch (e) {
          console.error("AI Evaluation failed:", e);
        }

        runtimePercentile = await calcRuntimePercentile(questionId, runResult.executionMs, passed, total);

        await CodingSubmission.create({
          userId,
          questionId,
          language: lang,
          code,
          status,
          passed,
          total,
          executionMs: runResult.executionMs,
          memoryMB: runResult.memoryMB,
          score,
          maxScore,
          compilationError: runResult.compilationError,
          timeComplexity,
          spaceComplexity,
          aiFeedback
        });
      }

      job.processed = total;
      job.status = 'complete';
      job.result = {
        passed, total, executionMs: runResult.executionMs,
        memoryMB: runResult.memoryMB,
        score, maxScore, status,
        stdout: runResult.stdout,
        compilationError: runResult.compilationError,
        runtimePercentile,
        timeComplexity,
        spaceComplexity,
        aiFeedback
      };
    } catch (err) {
      job.status = 'error';
      job.error = (err as Error).message;
    }

    cleanupJobs();
  });
}

// GET /api/coding/status/:jobId
export async function getJobStatus(req: Request, res: Response) {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired' });
  }

  res.json({
    status: job.status,
    processed: job.processed,
    total: job.total,
    result: job.status === 'complete' ? job.result : undefined,
    error: job.status === 'error' ? job.error : undefined,
  });
}

