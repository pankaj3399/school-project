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
    unique: true
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
  },
  type: {
    type: String,
    enum: ['Lead', 'Special'],
    required: true
  },
  grade: {
    type: String,
    required: function() { return this.type === 'Lead'; }
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

teacherSchema.index({ registrationToken: 1 });
teacherSchema.index({ schoolId: 1, grade: 1, type: 1 });

export default mongoose.model('Teacher', teacherSchema);