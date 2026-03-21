import mongoose from 'mongoose';
import {Role} from '../enum.js';
import { anonymizeIP, anonymizeUpdate, addIPAnonymizationMiddleware } from '../utils/ipAnonymizer.js';

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
      'District ID is required for accounts with DistrictAdmin role'
    ]
  },
  // Terms of Use tracking
  termsAcceptedAt: { type: Date },
  termsAcceptedIp: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  termsAcceptedVersion: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return !this.termsAccepted || (v && v.trim().length > 0);
      },
      message: 'termsAcceptedVersion is required when termsAccepted is true'
    }
  }
});



userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Apply IP anonymization middleware to protect termsAcceptedIp
addIPAnonymizationMiddleware(userSchema, ['termsAcceptedIp']);


userSchema.index({ schoolId: 1 });
userSchema.index({ districtId: 1 });

export default mongoose.model('User', userSchema);