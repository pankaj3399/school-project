import mongoose from 'mongoose';
import {Role} from '../enum.js';
import { anonymizeIP, anonymizeUpdate, addIPAnonymizationMiddleware } from '../utils/ipAnonymizer.js';

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
  termsAccepted: {
    type: Boolean,
    default: false
  },
  termsAcceptedAt: { type: Date },
  termsVersion: { 
    type: String,
    validate: {
      validator: function(v) {
        return !this.termsAccepted || (v && v.trim().length > 0);
      },
      message: 'termsVersion is required when termsAccepted is true'
    }
  },
  termsAcceptedIp: { type: String }
});

teacherSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Validate that teachers have either a password or a registration token
  if (!this.password && !this.registrationToken) {
    return next(new Error('Teacher must have either a password or a registration token'));
  }

  next();
});

// Apply IP anonymization middleware to protect termsAcceptedIp
addIPAnonymizationMiddleware(teacherSchema, ['termsAcceptedIp']);

teacherSchema.index({ registrationToken: 1 });
teacherSchema.index({ schoolId: 1, grade: 1, type: 1 });

export default mongoose.model('Teacher', teacherSchema);