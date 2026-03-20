import mongoose from 'mongoose';
import {Role} from '../enum.js';
import { anonymizeIP, anonymizeUpdate } from '../utils/ipAnonymizer.js';

// Stores different versions of Terms of Use
// Records are immutable to ensure historical auditability.
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
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
});

// Enforce immutability: Any material change must create a new TermsOfUse version.
TermsOfUseSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('TermsOfUse records are immutable. Any material change must create a new version.'));
  }
  next();
});

TermsOfUseSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
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

// Best-effort anonymization: protect privacy (PII) by masking the last octet/hextet.
TermsAcceptanceSchema.pre('save', function (next) {
  if (this.ipAddress) {
    this.ipAddress = anonymizeIP(this.ipAddress);
  }
  next();
});

// Query middleware to ensure ipAddress is masked for all persistence paths
TermsAcceptanceSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate();
  anonymizeUpdate(update, ['ipAddress']);
  next();
});

TermsAcceptanceSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc.ipAddress) {
        doc.ipAddress = anonymizeIP(doc.ipAddress);
      }
    });
  }
  next();
});

// Compound index for efficient lookups
TermsAcceptanceSchema.index({ userId: 1, termsVersion: 1 });

export const TermsOfUse = mongoose.model('TermsOfUse', TermsOfUseSchema);
export const TermsAcceptance = mongoose.model('TermsAcceptance', TermsAcceptanceSchema);
