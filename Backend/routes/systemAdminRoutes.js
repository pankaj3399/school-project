import express from 'express';
import multer from 'multer';
import {
  getDashboardStats,
  getStateLevelStats,
  getDistrictComparison,
  bulkImportSchools,
  cloneFromTemplate,
  getCurrentTerms,
  createTermsVersion,
  getAllTermsVersions,
  recordTermsAcceptance,
  getAllAdmins
} from '../controllers/systemAdminController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { Role } from '../enum.js';

const router = express.Router();

// Configure multer for file uploads (Excel import)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Public routes (no authentication required)
router.get('/terms', getCurrentTerms);

// All routes below this point require authentication
router.use(authenticateToken);

// SystemAdmin and Admin routes
router.get('/dashboard', authorizeRoles(Role.SystemAdmin, Role.Admin), getDashboardStats);
router.get('/analytics/states', authorizeRoles(Role.SystemAdmin, Role.Admin), getStateLevelStats);
router.get('/analytics/districts', authorizeRoles(Role.SystemAdmin, Role.Admin), getDistrictComparison);
router.post('/import/schools', authorizeRoles(Role.SystemAdmin, Role.Admin), upload.single('file'), bulkImportSchools);
router.post('/clone-district', authorizeRoles(Role.SystemAdmin, Role.Admin), cloneFromTemplate);
router.get('/admins', authorizeRoles(Role.SystemAdmin, Role.Admin), getAllAdmins);

// Terms management routes (authenticated)
router.get('/terms/all', authorizeRoles(Role.SystemAdmin, Role.Admin), getAllTermsVersions);
router.post('/terms', authorizeRoles(Role.SystemAdmin, Role.Admin), createTermsVersion);
router.post('/terms/accept', recordTermsAcceptance); // Used during registration

export default router;
