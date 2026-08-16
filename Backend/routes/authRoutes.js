import express from 'express';
import { login,resetPassword,sendOtp,signup, verifyOtp, completeVerification, sendVerifyEmail, createSupportTicket, changePassword, verifyLoginOtp, requestLoginOtp, verifyPassword, completeGuardianRegistration, getTerms } from '../controllers/authController.js';
import { authenticate, authorizeRoles, requireLeadIfTeacher } from '../middlewares/authMiddleware.js';
import { Role } from '../enum.js';
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/sendotp', sendOtp);
router.post('/verify', verifyOtp);
router.post('/sendVerificationMail', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), requireLeadIfTeacher, sendVerifyEmail);
router.post('/completeVerification', completeVerification);
router.get('/get-terms', getTerms);
router.post('/guardian-complete-registration', completeGuardianRegistration);
router.post('/resetpassword', resetPassword);
router.post('/changePassword', authenticate, changePassword);
router.post('/support-request',authenticate, createSupportTicket);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/request-login-otp', requestLoginOtp);
router.post('/verify-password', authenticate, verifyPassword);


export default router;