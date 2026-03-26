import mongoose from 'mongoose';
import {Role} from '../enum.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
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
    required: false,
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
  registrationToken: {
    type: String,
    default: null
  },
  registrationTokenExpires: {
    type: Date,
    default: null
  },
  // Terms of Use tracking
  termsAccepted: { type: Boolean, default: false },
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
  next();
});


userSchema.index({ schoolId: 1 });

export default mongoose.model('User', userSchema);