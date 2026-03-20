import mongoose from 'mongoose';
import {Role} from '../enum.js';
import { anonymizeIP, anonymizeUpdate } from '../utils/ipAnonymizer.js';

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

  // Best-effort anonymization: protect privacy (PII) by masking the last octet/hextet.
  // This is a string-based approach as a lightweight alternative to full IP parsing.
  if (this.termsAcceptedIp) {
    this.termsAcceptedIp = anonymizeIP(this.termsAcceptedIp);
  }

  next();
});

// Query middleware to ensure termsAcceptedIp is masked for all persistence paths
teacherSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate();
  anonymizeUpdate(update, ['termsAcceptedIp']);
  next();
});

teacherSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc.termsAcceptedIp) {
        doc.termsAcceptedIp = anonymizeIP(doc.termsAcceptedIp);
      }
    });
  }
  next();
});

teacherSchema.index({ registrationToken: 1 });
teacherSchema.index({ schoolId: 1, grade: 1, type: 1 });

export default mongoose.model('Teacher', teacherSchema);