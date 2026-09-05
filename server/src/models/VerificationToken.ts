import mongoose from 'mongoose';

const VerificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Optional: Automatically delete expired tokens from the DB after some time
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export const VerificationToken = mongoose.model('VerificationToken', VerificationTokenSchema);
