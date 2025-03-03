import express from 'express';
import { login,resetPassword,sendOtp,signup, verifyOtp, completeVerification, sendVerifyEmail } from '../controllers/authController.js';
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/sendotp', sendOtp);
router.post('/verify', verifyOtp);
router.post('/sendVerificationMail', sendVerifyEmail);
router.post('/completeVerification', completeVerification);
router.post('/resetpassword', resetPassword);

export default router;
 