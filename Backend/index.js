import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import bodyParser from 'body-parser'; 


import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import schoolAdminRoutes from './routes/schoolAdminRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import formRoutes from './routes/formRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import { authenticate } from './middlewares/authMiddleware.js';
import { getCurrentUser } from './controllers/generalController.js';
import errorHandler from './middlewares/errorHandler.js';
import CustomError from './utils/customError.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: "*", 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({limit: "50mb"}));



connectDB().catch((error) => {
  console.error('Error connecting to database', error);
});


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/schoolAdmin', schoolAdminRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/student', studentRoutes);
app.get("/api/user", authenticate, getCurrentUser);
app.use('/api/form', formRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

// Handle undefined routes (404 errors)
app.all('*', (req, res, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware (must be last middleware)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  // Close server gracefully & exit process
  server.close(() => {
    console.log('Process terminated due to unhandled rejection!');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
  console.log('Shutting down due to uncaught exception!');
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
