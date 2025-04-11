import express from 'express';
import { login,resetPassword,sendOtp,signup, verifyOtp, completeVerification, sendVerifyEmail, createSupportTicket } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/sendotp', sendOtp);
router.post('/verify', verifyOtp);
router.post('/sendVerificationMail', sendVerifyEmail);
router.post('/completeVerification', completeVerification);
router.post('/resetpassword', resetPassword);

router.post('/support-request',authenticate, createSupportTicket);

export default router;
 