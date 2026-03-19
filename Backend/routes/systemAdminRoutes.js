import express from 'express';
import multer from 'multer';
import {
  bulkImportSchools
} from '../controllers/systemAdminController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { Role } from '../enum.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes require authentication
router.use(authenticateToken);

router.post('/import/schools', authorizeRoles(Role.SystemAdmin), upload.single('file'), bulkImportSchools);

export default router;
