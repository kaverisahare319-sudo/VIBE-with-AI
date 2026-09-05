import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  completedOnboarding: {
    type: Boolean,
    default: false,
  },
  qualification: { type: String, default: null },
  status: { type: String, default: null },
  year: { type: String, default: null },
  specialization: { type: String, default: null },
  careerGoal: { type: String, default: null },
  industryInterest: { type: [String], default: [] },
  technologies: { type: [String], default: [] },
  skillsToImprove: { type: [String], default: [] },
  technicalLevel: { type: String, default: null },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
