import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunicationSession extends Document {
  userId: string;
  audioFile: string;
  communicationScore: number;
  fluencyScore: number;
  confidenceScore: number;
  clarityScore: number;
  grammarScore: number;
  fillerWords: string[];
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvementSuggestions: string[];
    recommendedPracticeAreas: string[];
  };
  toneAnalysis: string;
  professionalRating: string;
  speakingPace: string;
  vocabularyStrength: string;
  pronunciationScore: number;
  professionalismScore: number;
  energyScore: number;
  listeningReadinessScore: number;
  speakingSpeed: number; // WPM
  averagePause: number;
  longestPause: number;
  fillerCounts: {
    um: number;
    uh: number;
    like: number;
    actually: number;
    basically: number;
  };
  sentenceLength: number;
  vocabularyRichness: number;
  voiceMetrics: {
    voiceConfidence: string;
    voiceStability: string;
    pitch: string;
    volume: string;
    speakingSpeedLabel: string;
    tone: string;
    emotion: string;
    nervousness: string;
  };
  createdAt: Date;
}

const CommunicationSessionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  audioFile: { type: String },
  communicationScore: { type: Number, required: true },
  fluencyScore: { type: Number, required: true },
  confidenceScore: { type: Number, required: true },
  clarityScore: { type: Number, required: true },
  grammarScore: { type: Number, required: true },
  fillerWords: [{ type: String }],
  feedback: {
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    improvementSuggestions: [{ type: String }],
    recommendedPracticeAreas: [{ type: String }],
  },
  toneAnalysis: { type: String },
  professionalRating: { type: String },
  speakingPace: { type: String },
  vocabularyStrength: { type: String },
  pronunciationScore: { type: Number, default: 0 },
  professionalismScore: { type: Number, default: 0 },
  energyScore: { type: Number, default: 0 },
  listeningReadinessScore: { type: Number, default: 0 },
  speakingSpeed: { type: Number, default: 0 },
  averagePause: { type: Number, default: 0 },
  longestPause: { type: Number, default: 0 },
  fillerCounts: {
    um: { type: Number, default: 0 },
    uh: { type: Number, default: 0 },
    like: { type: Number, default: 0 },
    actually: { type: Number, default: 0 },
    basically: { type: Number, default: 0 },
  },
  sentenceLength: { type: Number, default: 0 },
  vocabularyRichness: { type: Number, default: 0 },
  voiceMetrics: {
    voiceConfidence: { type: String, default: '' },
    voiceStability: { type: String, default: '' },
    pitch: { type: String, default: '' },
    volume: { type: String, default: '' },
    speakingSpeedLabel: { type: String, default: '' },
    tone: { type: String, default: '' },
    emotion: { type: String, default: '' },
    nervousness: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICommunicationSession>('CommunicationSession', CommunicationSessionSchema);
