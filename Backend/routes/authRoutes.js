import express from 'express';
import { login,resetPassword,sendOtp,signup, verifyOtp } from '../controllers/authController.js';
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/sendotp', sendOtp);
router.post('/verify', verifyOtp);
router.post('/resetpassword', resetPassword);

export default router;
 
