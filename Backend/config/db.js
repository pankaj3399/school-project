import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models to ensure indexes
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import PointsHistory from '../models/PointsHistory.js';
import Admin from '../models/Admin.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected:', conn.connection.host);

    // Ensure indexes for performance optimization (non-blocking)
    try {
      await Promise.all([
        Student.createIndexes(),
        Teacher.createIndexes(),
        PointsHistory.createIndexes(),
        Admin.createIndexes(),
      ]);
      console.log('All database indexes ensured');
    } catch (indexError) {
      console.warn('Error ensuring indexes:', indexError.message);
    }

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
