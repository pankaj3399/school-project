import mongoose from 'mongoose';
import {Role} from '../enum.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    required: true,
  },
  approved:{
    type: Boolean,
    default: false,
  }
  ,
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
  // Terms of Use tracking
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

  // Best-effort anonymization: protect privacy (PII) by masking the last octet/hextet.
  if (this.termsAcceptedIp) {
    if (this.termsAcceptedIp.includes('.')) {
      this.termsAcceptedIp = this.termsAcceptedIp.replace(/\d+$/, '0');
    } else if (this.termsAcceptedIp.includes(':')) {
      const parts = this.termsAcceptedIp.split(':');
      if (parts.length > 1) {
        parts[parts.length - 1] = '0000';
        this.termsAcceptedIp = parts.join(':');
      }
    }
  }

  next();
});


userSchema.index({ schoolId: 1 });
userSchema.index({ districtId: 1 });

export default mongoose.model('User', userSchema);