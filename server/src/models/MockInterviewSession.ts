import mongoose, { Document, Schema } from 'mongoose';

export interface IMockInterviewSession extends Document {
  userId: string;
  role: string;
  level: string;
  type: string;
  questions: string[];
  transcript: string;
  overallScore: number;
  technicalAccuracy: number;
  communicationSkills: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  createdAt: Date;
}

const MockInterviewSessionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  type: { type: String, required: true },
  questions: [{ type: String }],
  transcript: { type: String, required: true },
  overallScore: { type: Number, required: true },
  technicalAccuracy: { type: Number, required: true },
  communicationSkills: { type: Number, required: true },
  confidence: { type: Number, required: true },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  detailedFeedback: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMockInterviewSession>('MockInterviewSession', MockInterviewSessionSchema);
