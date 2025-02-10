import mongoose from 'mongoose';
import {Role} from '../enum.js';

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email:{
    type: String,
    required: true,
    unique: true
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
  subject:{
    type:String,
    default: null
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
  }
});

teacherSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Teacher', teacherSchema);