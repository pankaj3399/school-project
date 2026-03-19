import mongoose from 'mongoose';

// Stores different versions of Terms of Use
const TermsOfUseSchema = new mongoose.Schema({
  version: { 
    type: String, 
    required: true, 
    unique: true 
  },
  title: {
    type: String,
    required: true,
    default: 'RADU E-Token™ Pilot Participation Agreement'
  },
  content: { 
    type: String, 
    required: true 
  },
  contentHtml: { 
    type: String 
  },
  effectiveDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Which districts/schools this version applies to (empty = all)
  applicableToDistricts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'District' 
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

// Stores individual user acceptance records
const TermsAcceptanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  userModel: {
    type: String,
    enum: ['Teacher', 'Student', 'User'],
    required: true
  },
  userType: { 
    type: String, 
    enum: ['Teacher', 'Guardian', 'Student', 'SchoolAdmin', 'DistrictAdmin'],
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

// Compound index for efficient lookups
TermsAcceptanceSchema.index({ userId: 1, termsVersion: 1 });

export const TermsOfUse = mongoose.model('TermsOfUse', TermsOfUseSchema);
export const TermsAcceptance = mongoose.model('TermsAcceptance', TermsAcceptanceSchema);
