import mongoose from 'mongoose';
import { Role } from '../enum.js';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: Object.values(Role),
    required: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null,
  },
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    default: null,
  },
  registrationToken: {
    type: String,
    default: null
  },
  registrationTokenExpires: {
    type: Date,
    default: null
  },
  // Terms of Use tracking
  termsAccepted: { type: Boolean, default: false },
  termsAcceptedAt: { type: Date },
  termsVersion: { type: String },
  termsAcceptedIp: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Hash registration token if it's new or modified
  if (this.isModified('registrationToken') && this.registrationToken) {
    this.registrationToken = crypto
      .createHash('sha256')
      .update(this.registrationToken)
      .digest('hex');
  }

  // Password is required for all roles except when an admin is invited but hasn't registered yet
  // If role is SystemAdmin or Admin and they have a registrationToken, password is not required yet
  const needsPassword = !this.registrationToken;
  if (needsPassword && !this.password && this.isNew) {
    return next(new Error('Password is required'));
  }

  next();
});

// Helper to compare raw token with hashed token
userSchema.methods.compareRegistrationToken = function (rawToken) {
  if (!this.registrationToken || !rawToken) return false;
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  return this.registrationToken === hashedToken;
};

userSchema.index({ schoolId: 1 });

export default mongoose.model('User', userSchema);