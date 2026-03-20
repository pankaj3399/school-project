import express from 'express';
import {
  getDashboardStats,
  getStateLevelStats,
  getDistrictComparison,
  getCurrentTerms,
  createTermsVersion,
  getAllTermsVersions,
  recordTermsAcceptance,
  getAllAdmins
} from '../controllers/systemAdminController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { Role } from '../enum.js';

const router = express.Router();

// Public routes
router.get('/terms', getCurrentTerms); 

// Route-level middleware
router.use(authenticateToken);

// Dashboard routes
router.get('/dashboard', authorizeRoles(Role.SystemAdmin), getDashboardStats);
router.get('/analytics/states', authorizeRoles(Role.SystemAdmin), getStateLevelStats);
router.get('/analytics/districts', authorizeRoles(Role.SystemAdmin), getDistrictComparison);
router.get('/admins', authorizeRoles(Role.SystemAdmin), getAllAdmins);

// Terms routes
router.get('/terms/all', authorizeRoles(Role.SystemAdmin), getAllTermsVersions);
router.post('/terms', authorizeRoles(Role.SystemAdmin), createTermsVersion);
router.post('/terms/accept', recordTermsAcceptance);

export default router;
