import { authenticateToken as authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { getFilteredPointHistory, getFormById, getForms, getPointHistory, submitFormAdmin, submitFormTeacher } from "../controllers/formController.js";

const router = express.Router();

router.get('/getForms',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.Student, Role.SystemAdmin, Role.Admin),getForms)
router.get('/getFormById/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.Student, Role.SystemAdmin, Role.Admin),getFormById)
router.post('/submitFormTeacher/:formId',authenticate,authorizeRoles(Role.Teacher),submitFormTeacher)
router.post('/submitFormAdmin/:formId',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin),submitFormAdmin)
router.get('/getPointHistory',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getPointHistory)
router.get('/getFilteredPointHistory',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getFilteredPointHistory)

export default router;
