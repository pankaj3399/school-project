import mongoose from 'mongoose';
import {Role} from '../enum.js';
import { anonymizeIP, anonymizeUpdate, addIPAnonymizationMiddleware } from '../utils/ipAnonymizer.js';

// Stores different versions of Terms of Use.
// Records are strictly immutable to ensure historical auditability.
// Any material change (content, HTML, dates, etc.) MUST be implemented by creating a new version.
const TermsOfUseSchema = new mongoose.Schema({
  version: { 
    type: String, 
    required: true, 
    unique: true,
    immutable: true
  },
  title: {
    type: String,
    default: 'RADU E-Token™ Pilot Participation Agreement'
  },
  content: { 
    type: String, 
    required: true,
    immutable: true
  },
  contentHtml: { 
    type: String,
    immutable: true
  },
  effectiveDate: { 
    type: Date, 
    required: true,
    immutable: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Which districts/schools this version applies to (empty = all)
  applicableToDistricts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'District',
    immutable: true
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
});

// Enforce immutability: Any material change must create a new TermsOfUse version.
TermsOfUseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (!this.isNew) {
    // Allow updating isActive but nothing else
    if (this.isModified('isActive') && !this.isModified('version') && !this.isModified('content') && !this.isModified('contentHtml')) {
        return next();
    }
    return next(new Error('TermsOfUse records are immutable. Any material change must create a new version.'));
  }
  next();
});

TermsOfUseSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
  // Check if only isActive is being updated
  const update = this.getUpdate();
  const keys = Object.keys(update);
  if (keys.length === 1 && keys[0] === 'isActive') {
      return next();
  }
  return next(new Error('TermsOfUse records are immutable. Any material change must create a new version.'));
});

// Stores individual user acceptance records
const TermsAcceptanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true
  },
  userModel: {
    type: String,
    enum: ['Teacher', 'Student', 'User'],
    required: true
  },
  userType: { 
    type: String, 
    enum: Object.values(Role),
    required: true
  },
  termsVersion: { 
    type: String, 
    required: true,
    index: true
  },
  acceptedAt: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District'
  }
});

// Apply IP anonymization middleware to protect ipAddress
addIPAnonymizationMiddleware(TermsAcceptanceSchema, ['ipAddress']);

// Compound index for efficient lookups
TermsAcceptanceSchema.index({ userId: 1, termsVersion: 1 });

export const TermsOfUse = mongoose.model('TermsOfUse', TermsOfUseSchema);
export const TermsAcceptance = mongoose.model('TermsAcceptance', TermsAcceptanceSchema);
