import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  otp: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    },
  },
});

otpSchema.index({ otp: 1, userId: 1 });
otpSchema.index({ expiresAt: 1 });

export default mongoose.model('Otp', otpSchema);
