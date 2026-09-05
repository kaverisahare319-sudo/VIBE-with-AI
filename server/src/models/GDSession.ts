import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: string;
  avatar: string;
  text: string;
  isModerator?: boolean;
  isUser?: boolean;
}

export interface IGDSession extends Document {
  userId: string;
  topic: string;
  participationScore: number;
  leadershipScore: number;
  teamworkScore: number;
  communicationScore: number;
  confidenceScore: number;
  overallScore: number;
  performanceFeedback: string;
  suggestions: string[];
  chatTranscript: IMessage[];
  createdAt: Date;
}

const GDSessionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  topic: { type: String, required: true },
  participationScore: { type: Number, required: true },
  leadershipScore: { type: Number, required: true },
  teamworkScore: { type: Number, required: true },
  communicationScore: { type: Number, required: true },
  confidenceScore: { type: Number, required: true },
  overallScore: { type: Number, required: true },
  performanceFeedback: { type: String, required: true },
  suggestions: [{ type: String }],
  chatTranscript: [{
    sender: { type: String },
    avatar: { type: String },
    text: { type: String },
    isModerator: { type: Boolean },
    isUser: { type: Boolean }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IGDSession>('GDSession', GDSessionSchema);
