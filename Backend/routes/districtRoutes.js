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
router.post('/', authorizeRoles(Role.SystemAdmin), createDistrict);
router.get('/', authorizeRoles(Role.SystemAdmin), getDistricts);
router.delete('/:id', authorizeRoles(Role.SystemAdmin), deleteDistrict);
router.post('/:id/admins', authorizeRoles(Role.SystemAdmin), assignDistrictAdmin);

// SystemAdmin and DistrictAdmin routes
router.get('/:id', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin), getDistrictById);
router.put('/:id', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin), updateDistrict);
router.get('/:id/stats', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin), getDistrictStats);
router.post('/:id/schools', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin), addSchoolToDistrict);
router.get('/:id/schools', authorizeRoles(Role.SystemAdmin, Role.DistrictAdmin), getDistrictSchools);

export default router;
