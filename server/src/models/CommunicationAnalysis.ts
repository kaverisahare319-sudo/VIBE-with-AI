import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunicationAnalysis extends Document {
  userId: string;
  question: string;
  answer: string;
  grammarScore: number;
  fluencyScore: number;
  relevanceScore: number;
  confidenceScore: number;
  overallScore: number;
  feedback: {
    strengths: string[];
    areasForImprovement: string[];
    betterResponseStyle: string;
    professionalTips: string[];
  };
  createdAt: Date;
}

const CommunicationAnalysisSchema: Schema = new Schema({
  userId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  grammarScore: { type: Number, required: true },
  fluencyScore: { type: Number, required: true },
  relevanceScore: { type: Number, required: true },
  confidenceScore: { type: Number, required: true },
  overallScore: { type: Number, required: true },
  feedback: {
    strengths: [{ type: String }],
    areasForImprovement: [{ type: String }],
    betterResponseStyle: { type: String },
    professionalTips: [{ type: String }],
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICommunicationAnalysis>('CommunicationAnalysis', CommunicationAnalysisSchema);
