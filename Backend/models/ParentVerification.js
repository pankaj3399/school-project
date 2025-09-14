import mongoose from 'mongoose';

const parentVerificationSchema = new mongoose.Schema({
  studentEmail: {
    type: String,
    required: true,
    index: true
  },
  parentOneEmail: {
    type: String,
    default: null
  },
  isParentOneEmailVerified: {
    type: Boolean,
    default: false
  },
  parentTwoEmail: {
    type: String,
    default: null
  },
  isParentTwoEmailVerified: {
    type: Boolean,
    default: false
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for efficient lookups
parentVerificationSchema.index({ studentEmail: 1, schoolId: 1 });

parentVerificationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('ParentVerification', parentVerificationSchema);