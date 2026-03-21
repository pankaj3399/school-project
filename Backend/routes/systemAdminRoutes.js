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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

router.post('/import/schools', authorizeRoles(Role.SystemAdmin), upload.single('file'), bulkImportSchools);

// Error handling middleware for Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Only Excel files (.xlsx, .xls) are allowed') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

export default router;
