import express from 'express';
import multer from 'multer';
import {
  getDashboardStats,
  getStateLevelStats,
  getDistrictComparison,
  getCurrentTerms,
  createTermsVersion,
  getAllTermsVersions,
  recordTermsAcceptance,
  getAllAdmins,
  bulkImportSchools
} from '../controllers/systemAdminController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { Role } from '../enum.js';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const idx = file.originalname.lastIndexOf('.');
    const extension = idx === -1 ? '' : file.originalname.toLowerCase().substring(idx);
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      const error = new Error('Only Excel files (.xlsx, .xls) are allowed');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

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

// Import routes
router.post('/import/schools', authorizeRoles(Role.SystemAdmin), upload.single('file'), bulkImportSchools);

// Error handling middleware for Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

export default router;
