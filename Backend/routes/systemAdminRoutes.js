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
  getAllAdmins,
  inviteAdmin,
  updateAdmin,
  reInviteAdmin,
  completeAdminRegistration
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
router.post('/complete-registration', completeAdminRegistration);

// All routes below this point require authentication
router.use(authenticateToken);

// Platform-admin-only analytics and district cloning
router.get('/dashboard', authorizeRoles(Role.SystemAdmin), getDashboardStats);
router.get('/analytics/states', authorizeRoles(Role.SystemAdmin), getStateLevelStats);
router.get('/analytics/districts', authorizeRoles(Role.SystemAdmin), getDistrictComparison);

// Bulk import with customized error handling for Multer
router.post('/import/schools', authorizeRoles(Role.SystemAdmin), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading (e.g. file too large)
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading (e.g. invalid file type from fileFilter)
      return res.status(400).json({ message: err.message });
    }
    // Everything went fine, proceed to controller
    next();
  });
}, bulkImportSchools);
router.post('/clone-district', authorizeRoles(Role.SystemAdmin), cloneFromTemplate);
router.get('/admins', authorizeRoles(Role.SystemAdmin), getAllAdmins);
router.post('/invite', authorizeRoles(Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), inviteAdmin);
router.put('/admins/:id', authorizeRoles(Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), updateAdmin);
router.post('/admins/:id/reinvite', authorizeRoles(Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), reInviteAdmin);

// Terms management routes (authenticated)
router.get('/terms/all', authorizeRoles(Role.SystemAdmin), getAllTermsVersions);
router.post('/terms', authorizeRoles(Role.SystemAdmin), createTermsVersion);
router.post('/terms/accept', authenticateToken, recordTermsAcceptance); // Used during registration

export default router;
