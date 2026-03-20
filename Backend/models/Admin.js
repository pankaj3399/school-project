import mongoose from 'mongoose';
import {Role} from '../enum.js';
import { anonymizeIP, anonymizeUpdate } from '../utils/ipAnonymizer.js';

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
    required: [
      function() { return this.role === Role.DistrictAdmin; },
      'District ID is required for District Admins'
    ]
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
    this.termsAcceptedIp = anonymizeIP(this.termsAcceptedIp);
  }

  next();
});

// Query middleware to ensure termsAcceptedIp is masked for all persistence paths
userSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate();
  anonymizeUpdate(update, ['termsAcceptedIp']);
  next();
});

userSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc.termsAcceptedIp) {
        doc.termsAcceptedIp = anonymizeIP(doc.termsAcceptedIp);
      }
    });
  }
  next();
});


userSchema.index({ schoolId: 1 });
userSchema.index({ districtId: 1 });

export default mongoose.model('User', userSchema);