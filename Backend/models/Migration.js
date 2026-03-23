import mongoose from 'mongoose';

const MigrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  executedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Migration = mongoose.model('Migration', MigrationSchema);

export default Migration;
