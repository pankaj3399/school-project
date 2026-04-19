import express from 'express';
import {
  createDistrict,
  getDistricts,
  getDistrictById,
  updateDistrict,
  deleteDistrict,
  getDistrictStats,
  addSchoolToDistrict,
  getDistrictSchools,
  assignDistrictAdmin
} from '../controllers/districtController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { ensureDistrictOwnership } from '../middlewares/ownershipMiddleware.js';
import upload from '../middlewares/multer.js';
import { Role } from '../enum.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// District Registration & Management (System Admin / Admin)
router.get('/', authorizeRoles(Role.SystemAdmin, Role.Admin), getDistricts);
router.post('/', authorizeRoles(Role.SystemAdmin, Role.Admin), createDistrict);
router.get('/:id', authorizeRoles(Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), ensureDistrictOwnership, getDistrictById);
router.put('/:id', authorizeRoles(Role.SystemAdmin, Role.Admin), upload.single('logo'), updateDistrict);
router.delete('/:id', authorizeRoles(Role.SystemAdmin, Role.Admin), deleteDistrict);
router.post('/:id/admins', authorizeRoles(Role.SystemAdmin, Role.Admin), assignDistrictAdmin);

// School Operations within Districts (Admin/DistrictAdmin)

// District-specific operations (SystemAdmin, DistrictAdmin, Admin)
router.get('/:id/stats', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), ensureDistrictOwnership, getDistrictStats);
router.post('/:id/schools', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), ensureDistrictOwnership, addSchoolToDistrict);
router.get('/:id/schools', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), ensureDistrictOwnership, getDistrictSchools);

export default router;
