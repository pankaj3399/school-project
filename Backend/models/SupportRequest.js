import mongoose from 'mongoose';

const generateTicketNumber = function(state, schoolId) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `SUP-${year}${month}${day}-${state}-${schoolId}-${randomNum}`;
};

const supportRequestSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
  },
  subject: {
    type: String,
    default: null
  },
  username: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  schoolName: {
    type: String,
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  state: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: null
  },
  preferredContactMethod: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  issue: {
    type: String,
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
}, {
  timestamps: true
});

// Pre-save middleware to generate ticket number
supportRequestSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    this.ticketNumber = generateTicketNumber(this.state, this.schoolId);
  }
  next();
});

supportRequestSchema.index({ schoolId: 1 });
supportRequestSchema.index({ userId: 1 });
supportRequestSchema.index({ status: 1 });

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);

export default SupportRequest;
