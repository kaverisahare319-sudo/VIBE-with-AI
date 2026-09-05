import mongoose, { Document, Schema } from 'mongoose';

export type GDRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export type CommunicationMode = 'chat' | 'voice' | 'video';
export type AvailabilitySlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface IGDRequest extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  preferredDate: Date;
  preferredTime: string;
  topic: string;
  communicationMode: CommunicationMode;
  numberOfParticipants: number;
  availabilitySlot: AvailabilitySlot;
  notes?: string;
  status: GDRequestStatus;
  // Admin assignment fields
  assignedDate?: Date;
  assignedTime?: string;
  assignedTopic?: string;
  assignedParticipantCount?: number;
  assignedMode?: CommunicationMode;
  meetingLink?: string;
  sessionId?: mongoose.Types.ObjectId;
  adminNotes?: string;
  rejectionReason?: string;
  evaluationReport?: any;
  createdAt: Date;
  updatedAt: Date;
}

const GDRequestSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  topic: { type: String, required: true },
  communicationMode: { type: String, enum: ['chat', 'voice', 'video'], required: true },
  numberOfParticipants: { type: Number, min: 2, max: 6, required: true },
  availabilitySlot: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'], default: 'pending' },
  assignedDate: { type: Date },
  assignedTime: { type: String },
  assignedTopic: { type: String },
  assignedParticipantCount: { type: Number },
  assignedMode: { type: String, enum: ['chat', 'voice', 'video'] },
  meetingLink: { type: String },
  sessionId: { type: Schema.Types.ObjectId, ref: 'LiveGDSession' },
  adminNotes: { type: String },
  rejectionReason: { type: String },
  evaluationReport: { type: Schema.Types.Mixed },
}, { timestamps: true });

// Index for matchmaking
GDRequestSchema.index({ preferredDate: 1, topic: 1, communicationMode: 1, numberOfParticipants: 1, status: 1 });

export default mongoose.model<IGDRequest>('GDRequest', GDRequestSchema, 'gdRequests');

