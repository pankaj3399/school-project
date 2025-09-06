import mongoose from 'mongoose';
import {Role} from '../enum.js';

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
    index: true  // Auth lookup
  },
  password: {
    type: String,
    required: true,
  },
  approved:{
    type: Boolean,
    default: false,
    index: true  // Pending approvals
  }
  ,
  role: {
    type: String,
    enum: Object.values(Role),
    required: true,
    index: true  // Filter by role
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', 
    default: null,
    index: true  // Admin by school
  },
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

// Compound indexes
userSchema.index({ schoolId: 1, role: 1 });
userSchema.index({ approved: 1, role: 1 });

export default mongoose.model('User', userSchema);