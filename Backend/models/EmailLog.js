import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  direction: {
    type: String,
    enum: ['outbound'],
    required: true,
  },
  to: {
    type: String,
    default: '',
  },
  from: {
    type: String,
    default: '',
  },
  replyTo: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  provider: {
    type: String,
    enum: ['sendgrid', 'nodemailer'],
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    required: true,
  },
  error: {
    type: String,
    default: '',
  },
  hasAttachment: {
    type: Boolean,
    default: false,
  },
  durationMs: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ to: 1, createdAt: -1 });

export default mongoose.model('EmailLog', emailLogSchema);
