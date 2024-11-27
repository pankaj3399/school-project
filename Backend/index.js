import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';


import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';


dotenv.config();


connectDB();

const app = express();


app.use(cors());
app.use(express.json()); 


app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminRoutes); 
app.use('/api/teacher', teacherRoutes); 

app.get('/', (req, res) => {
    res.json({ message: 'API is running...' });
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Server Error', error: err.message });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
