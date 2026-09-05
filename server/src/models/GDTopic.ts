import mongoose, { Document, Schema } from 'mongoose';

export interface IGDTopic extends Document {
  title: string;
  category: string;
  description?: string;
  isActive: boolean;
  addedDate: Date;
}

const GDTopicSchema: Schema = new Schema({
  title: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: [
      'Current Affairs',
      'Economy',
      'Technology',
      'Artificial Intelligence',
      'Education',
      'Startups',
      'Business',
      'Healthcare',
      'Environment',
      'Sports',
      'International Affairs',
      'Social Issues',
    ],
    required: true,
  },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  addedDate: { type: Date, default: Date.now },
});

export default mongoose.model<IGDTopic>('GDTopic', GDTopicSchema);
