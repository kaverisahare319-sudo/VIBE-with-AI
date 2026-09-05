import mongoose from 'mongoose';

const OtpTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  usedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Auto-delete expired OTP documents after 1 hour
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const OtpToken = mongoose.model('OtpToken', OtpTokenSchema);
