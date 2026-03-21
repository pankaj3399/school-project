import mongoose from 'mongoose';

const DistrictSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  address: { 
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: { 
    type: String, 
    required: true, 
    index: true 
  },
  zipCode: {
    type: String,
    default: ''
  },
  country: { 
    type: String, 
    default: 'USA' 
  },
  contactEmail: { 
    type: String,
    lowercase: true,
    trim: true
  },
  contactPhone: { 
    type: String 
  },
  contactName: {
    type: String
  },
  logo: { 
    type: String 
  },
  
  // Subscription & Access
  subscriptionStatus: { 
    type: String, 
    enum: ['active', 'pending', 'suspended', 'expired'], 
    default: 'pending',
    index: true
  },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  
  // Terms of Use
  termsAcceptedAt: { type: Date },
  termsVersion: { type: String },
  termsAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Settings (clone from templates)
  settings: {
    tokenName: { type: String, default: 'E-Token' },
    maxTokensPerDay: { type: Number, default: 100 },
    defaultFormTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }],
    allowTeacherFormCreation: { type: Boolean, default: true },
    requireGuardianVerification: { type: Boolean, default: true }
  },
  
  // Template functionality
  isTemplate: { type: Boolean, default: false },
  templateSourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  
  // Audit
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
DistrictSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient queries
DistrictSchema.index({ state: 1, subscriptionStatus: 1 });
DistrictSchema.index({ createdAt: -1 });

export default mongoose.model('District', DistrictSchema);
