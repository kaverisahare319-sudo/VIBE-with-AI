import mongoose, { Document, Schema } from 'mongoose';

export interface IPlacementPrediction extends Document {
  userId: string;
  readinessOverall: number;
  interviewReadiness: number;
  communicationReadiness: number;
  technicalReadiness: number;
  companyWise: {
    name: string;
    matchPercentage: number;
    status: string; // 'Ready', 'Almost Ready', 'Needs Practice'
  }[];
  skillGaps: string[];
  roadmap: string[];
  createdAt: Date;
}

const PlacementPredictionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  readinessOverall: { type: Number, required: true },
  interviewReadiness: { type: Number, required: true },
  communicationReadiness: { type: Number, required: true },
  technicalReadiness: { type: Number, required: true },
  companyWise: [
    {
      name: { type: String, required: true },
      matchPercentage: { type: Number, required: true },
      status: { type: String, required: true },
    }
  ],
  skillGaps: [{ type: String }],
  roadmap: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPlacementPrediction>('PlacementPrediction', PlacementPredictionSchema);
