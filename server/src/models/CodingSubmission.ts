import mongoose, { Schema, Document } from 'mongoose';

export interface ICodingSubmission extends Document {
  userId: string;
  questionId: number;
  language: string;
  code: string;
  status: 'correct' | 'partial' | 'wrong' | 'error' | 'tle';
  passed: number;
  total: number;
  executionMs: number;
  memoryMB: number;
  score: number;
  maxScore: number;
  compilationError?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  aiFeedback?: string;
  createdAt: Date;
}

const CodingSubmissionSchema = new Schema<ICodingSubmission>({
  userId: { type: String, required: true, index: true },
  questionId: { type: Number, required: true, index: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['correct', 'partial', 'wrong', 'error', 'tle'], required: true },
  passed: { type: Number, required: true },
  total: { type: Number, required: true },
  executionMs: { type: Number, required: true },
  memoryMB: { type: Number, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  compilationError: { type: String },
  timeComplexity: { type: String },
  spaceComplexity: { type: String },
  aiFeedback: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Index for fetching a user's latest submission for a question
CodingSubmissionSchema.index({ userId: 1, questionId: 1, createdAt: -1 });

// Index for calculating runtime percentiles across all users for a question
CodingSubmissionSchema.index({ questionId: 1, status: 1, executionMs: 1 });

export default mongoose.model<ICodingSubmission>('CodingSubmission', CodingSubmissionSchema);
