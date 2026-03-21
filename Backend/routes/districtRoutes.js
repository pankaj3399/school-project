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
import { Role } from '../enum.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// SystemAdmin only routes
router.post('/', authorizeRoles(Role.SystemAdmin, Role.Admin), createDistrict);
router.get('/', authorizeRoles(Role.SystemAdmin, Role.Admin), getDistricts);
router.delete('/:id', authorizeRoles(Role.SystemAdmin, Role.Admin), deleteDistrict);
router.post('/:id/admins', authorizeRoles(Role.SystemAdmin, Role.Admin), assignDistrictAdmin);

// SystemAdmin and DistrictAdmin routes
router.get('/:id', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), getDistrictById);
router.put('/:id', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), updateDistrict);
router.get('/:id/stats', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), getDistrictStats);
router.post('/:id/schools', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), addSchoolToDistrict);
router.get('/:id/schools', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin, Role.Admin), getDistrictSchools);

export default router;
