//b
import { addSchool, addStudent, addTeacher, getFormsSubmittedPerMonth, getFormsSubmittedPerMonthPerTeacher, getMonthlyStats, getPointsGivenPerMonth, getPointsGivenPerMonthPerTeacher, getPointsReceivedPerMonth, getStats } from "../controllers/schoolAdminController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { createForm, editForm, deleteForm } from "../controllers/formController.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.SchoolAdmin), (req, res) => {
    res.json({ message:` Welcome School Admin: ${req.user.id} `});
});

router.post('/addSchool',authenticate,authorizeRoles(Role.SchoolAdmin),upload.single('logo'),addSchool)

router.post('/addTeacher',authenticate,authorizeRoles(Role.SchoolAdmin),addTeacher)
router.post('/addStudent',authenticate,authorizeRoles(Role.SchoolAdmin),addStudent)

router.post('/createForm',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),createForm)
router.post('/editForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),editForm)
router.delete('/deleteForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),deleteForm)

router.get('/stats', authenticate, authorizeRoles(Role.SchoolAdmin), getStats);
router.get('/stats/monthly', authenticate, authorizeRoles(Role.SchoolAdmin), getMonthlyStats);
router.get('/stats/pointsgiven', authenticate, authorizeRoles(Role.SchoolAdmin), getPointsGivenPerMonth);
router.get('/stats/pointsgiven/:teacherId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher), getPointsGivenPerMonthPerTeacher);
router.get('/stats/pointsreceived/:studentId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.Student), getPointsReceivedPerMonth);
router.get('/stats/formsubmitted', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher), getFormsSubmittedPerMonth);
router.get('/stats/formsubmitted/:teacherId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher), getFormsSubmittedPerMonthPerTeacher);

export default router;
