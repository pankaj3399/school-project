import mongoose from 'mongoose';
import {Role} from '../enum.js';

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
    index: true,  // Auth lookup
    lowercase: true,
    trim: true
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
    index: true  // School queries
  },
  type: {
    type: String,
    enum: ['Lead', 'Special'],
    required: true,
    index: true  // Filter by teacher type
  },
  grade: {
    type: String,
    required: function() { return this.type === 'Lead'; },
    index: true,  // Lead teacher by grade
    sparse: true  // Only index when present
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
  }
});

teacherSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


// Compound indexes
teacherSchema.index({ schoolId: 1, type: 1 });           // Teachers by school and type
teacherSchema.index({ schoolId: 1, grade: 1 });          // Lead teachers by grade
teacherSchema.index({ type: 1, grade: 1 });              // Lead teachers across schools

export default mongoose.model('Teacher', teacherSchema);