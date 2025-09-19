import mongoose from 'mongoose';
import {Role} from '../enum.js';

const GaurdianSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    default: null,
  },
})

const studentSchema = new mongoose.Schema({
  email:{
    type: String,
    required: true,
    unique: true,
    index: true,  // Single field index
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(Role),
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
  standard:{
    type:String,
    default: null,
    index: true  // Search by standard
  },
  points:{
    type: Number,
    default: 0,
    index: true   // Leaderboard queries
  },
  parentEmail:{
    type:String,
    default: null,
    index: true,  // Parent lookup
    sparse: true  // Only index non-null values
  },
  sendNotifications:{
    type:Boolean,
    default: false
  },
  schoolId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', 
    default: null,
    index: true  // Foreign key index
  },
  grade: {
    type: String,
    required: true,
    default: 1,
    index: true  // Frequently queried
  },
  isParentOneEmailVerified:{
    type:Boolean,
    default: false
  },
  isParentTwoEmailVerified:{
    type:Boolean,
    default: false
  },
  emailVerificationCode:{
    type:String,
    default: null
  },
  studentEmailVerificationCode:{
    type:String,
    default: null
  },
  isStudentEmailVerified:{
    type:Boolean,
    default: false
  },
  pendingEtokens:{
    type:[String],
    default: []
  },
  guardian1:{
    type: GaurdianSchema,
    default: null
  },
  gaurdian2:{
    type: GaurdianSchema,
    default: null
  }
});

studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound indexes for common queries
studentSchema.index({ schoolId: 1, grade: 1 });           // Students by school and grade
studentSchema.index({ schoolId: 1, points: -1 });         // School leaderboard
studentSchema.index({ schoolId: 1, standard: 1 });        // Students by school and standard
studentSchema.index({ email: 1, schoolId: 1 });           // Unique constraint per school

export default mongoose.model('Student', studentSchema);