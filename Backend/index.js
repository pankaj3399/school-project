import 'express-async-errors';
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

// 404 fallback (ADDED) - must be before central error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// central error handler 
app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
