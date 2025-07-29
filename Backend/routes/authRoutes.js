import express from 'express';
import { login,resetPassword,sendOtp,signup, verifyOtp, completeVerification, sendVerifyEmail, createSupportTicket, changePassword, verifyLoginOtp, requestLoginOtp, verifyPassword } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/sendotp', sendOtp);
router.post('/verify', verifyOtp);
router.post('/sendVerificationMail', sendVerifyEmail);
router.post('/completeVerification', completeVerification);
router.post('/resetpassword', resetPassword);
router.post('/changePassword', authenticate, changePassword);
router.post('/support-request',authenticate, createSupportTicket);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/request-login-otp', requestLoginOtp);
router.post('/verify-password', authenticate, verifyPassword);


export default router;