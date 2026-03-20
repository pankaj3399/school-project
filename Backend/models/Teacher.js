import mongoose from 'mongoose';
import {Role} from '../enum.js';

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  email:{
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email address format'
    }
  },
  password: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.Teacher,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  subject:{
    type:String,
    default: null,
    required: false
  },
  recieveMails:{
    type:Boolean,
    default: false
  },
  schoolId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', 
    default: null,
  },
  type: {
    type: String,
    enum: ['Lead', 'Special'],
    required: true
  },
  grade: {
    type: String,
    required: function() { return this.type === 'Lead'; }
  },
  isEmailVerified:{
    type:Boolean,
    default: false
  },
  emailVerificationCode:{
    type:String,
    default: null
  },
  isFirstLogin:{
    type:Boolean,
    default: false
  },
  registrationToken: {
    type: String,
    default: null
  },
  // Terms of Use tracking
  termsAcceptedAt: { type: Date },
  termsVersion: { type: String },
  termsAcceptedIp: { type: String }
});

teacherSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Validate that teachers have either a password or a registration token
  if (!this.password && !this.registrationToken) {
    return next(new Error('Teacher must have either a password or a registration token'));
  }

  // Anonymize IP address to protect privacy (PII)
  if (this.termsAcceptedIp) {
    // Truncate the last octet for IPv4 or mask for IPv6
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

teacherSchema.index({ registrationToken: 1 });
teacherSchema.index({ schoolId: 1, grade: 1, type: 1 });

export default mongoose.model('Teacher', teacherSchema);