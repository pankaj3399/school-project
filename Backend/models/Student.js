import mongoose from 'mongoose';


const studentSchema = new mongoose.Schema({
  email:{
    type:String,
    required:true,
    unique:true
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
    enum: ['Admin', 'SchoolAdmin', 'Teacher', 'Student'],
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
    default: null
  },
  points:{
    type: Number,
    default: 0
  }
});

studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


export default mongoose.model('Student', studentSchema);