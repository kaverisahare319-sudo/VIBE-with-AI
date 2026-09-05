import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  resumeText: string;
  atsScore: number;
  impactScore: number;
  brevityScore: number;
  missingKeywords: string[];
  formattingIssues: string[];
  bulletPointFeedback: string[];
  overallFeedback: string;
  createdAt: Date;
}

const ResumeAnalysisSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resumeText: { type: String, required: true },
  atsScore: { type: Number, required: true },
  impactScore: { type: Number, required: true },
  brevityScore: { type: Number, required: true },
  missingKeywords: { type: [String], default: [] },
  formattingIssues: { type: [String], default: [] },
  bulletPointFeedback: { type: [String], default: [] },
  overallFeedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ResumeAnalysis || mongoose.model<IResumeAnalysis>('ResumeAnalysis', ResumeAnalysisSchema);
