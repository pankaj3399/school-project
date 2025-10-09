import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { getFilteredPointHistory, getFormById, getForms, getPointHistory, submitFormAdmin, submitFormTeacher } from "../controllers/formController.js";

const router = express.Router();

router.get('/getForms',authenticate,authorizeRoles(Role.SchoolAdmin,Role.Teacher, Role.Student),getForms)
router.get('/getFormById/:id',authenticate,authorizeRoles(Role.SchoolAdmin,Role.Teacher, Role.Student),getFormById)
router.post('/submitFormTeacher/:formId',authenticate,authorizeRoles(Role.Teacher),submitFormTeacher)
router.post('/submitFormAdmin/:formId',authenticate,authorizeRoles(Role.SchoolAdmin),submitFormAdmin)
router.get('/getPointHistory',authenticate,authorizeRoles(Role.SchoolAdmin,Role.Teacher),getPointHistory)
router.get('/getFilteredPointHistory',authenticate,authorizeRoles(Role.SchoolAdmin,Role.Teacher),getFilteredPointHistory)

export default router;
