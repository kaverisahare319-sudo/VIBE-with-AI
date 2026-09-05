import mongoose, { Document, Schema } from 'mongoose';

export interface IBodyLanguageSession extends Document {
  userId: string;
  eyeContactScore: number;
  confidenceScore: number;
  bodyLanguageScore: number;
  expressionScore: number;
  postureScore: number;
  movementScore: number;
  overallPresenceScore: number;
  eyeContactQuality: string;
  confidenceLevel: string;
  feedback: {
    strengths: string[];
    improvements: string[];
  };
  readinessLevel: string;
  duration: number;
  createdAt: Date;
}

const BodyLanguageSessionSchema: Schema = new Schema({
  userId:               { type: String, required: true },
  eyeContactScore:      { type: Number, required: true },
  confidenceScore:      { type: Number, required: true },
  bodyLanguageScore:    { type: Number, required: true },
  expressionScore:      { type: Number, required: true },
  postureScore:         { type: Number, required: true },
  movementScore:        { type: Number, required: true },
  overallPresenceScore: { type: Number, required: true },
  eyeContactQuality:    { type: String, required: true },
  confidenceLevel:      { type: String, required: true },
  feedback: {
    strengths:    [{ type: String }],
    improvements: [{ type: String }],
  },
  readinessLevel: { type: String, required: true },
  duration:       { type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now }
});

export default mongoose.model<IBodyLanguageSession>('BodyLanguageSession', BodyLanguageSessionSchema);
