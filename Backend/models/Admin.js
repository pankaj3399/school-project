import mongoose from 'mongoose';


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
    enum: ['Admin', 'SchoolAdmin', 'Teacher', 'Student'],
    required: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', 
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


export default mongoose.model('User', userSchema);