import mongoose, { Schema, Document } from 'mongoose';

export interface IAIPlacementAssessment extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  difficulty: string;
  duration: number;
  mode: string;
  companyName?: string;
  customTopic?: string;
  
  scores: {
    overallEmployability: number;
    technical: number;
    communication: number;
    confidence: number;
    bodyLanguage: number;
    facialExpression: number;
    voice: number;
    problemSolving: number;
    professionalism: number;
  };
  
  feedback: {
    strengths: string[];
    improvements: string[];
  };

  transcript: { sender: string; text: string }[];
  hiringProbability: number;
  completedAt: Date;
}

const AIPlacementAssessmentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  difficulty: { type: String, required: true },
  duration: { type: Number, required: true },
  mode: { type: String, required: true },
  companyName: { type: String },
  customTopic: { type: String },
  
  scores: {
    overallEmployability: { type: Number, required: true },
    technical: { type: Number, required: true },
    communication: { type: Number, required: true },
    confidence: { type: Number, required: true },
    bodyLanguage: { type: Number, required: true },
    facialExpression: { type: Number, required: false },
    voice: { type: Number, required: false },
    problemSolving: { type: Number, required: true },
    professionalism: { type: Number, required: true },
  },
  
  feedback: {
    strengths: [{ type: String }],
    improvements: [{ type: String }],
  },

  transcript: [{
    sender: { type: String, required: true },
    text: { type: String, required: true }
  }],

  hiringProbability: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAIPlacementAssessment>('AIPlacementAssessment', AIPlacementAssessmentSchema);
