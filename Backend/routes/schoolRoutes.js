import express from 'express';
import { getAllSchools, getStudents, getTeachers,getCurrentSchool } from '../controllers/schoolController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/',getAllSchools);
router.get('/students',authenticate,authorizeRoles('SchoolAdmin'),getStudents);
router.get('/teachers',authenticate,authorizeRoles('SchoolAdmin'),getTeachers);
router.get('/school',authenticate,authorizeRoles('SchoolAdmin'),getCurrentSchool);




export default router;