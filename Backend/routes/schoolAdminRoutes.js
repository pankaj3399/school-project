import { addSchool, addStudent,  getFormsSubmittedPerMonth, getFormsSubmittedPerMonthPerTeacher, getMonthlyStats, getPointsGivenPerMonth, getPointsGivenPerMonthPerTeacher, getPointsReceivedPerMonth, getStats, resetStudentRoster, sendReport, genreport, teacherRoster, studentRoster, sendResetOtp, verifyResetOtp } from "../controllers/schoolAdminController.js";
import { authenticateToken as authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { createForm, editForm, deleteForm } from "../controllers/formController.js";
import upload from "../middlewares/multer.js";
import { getCombinedStudentPointsHistory, getStudentPointsHistory } from "../controllers/pointhistoryController.js";
import { addTeacher } from "../controllers/teacherController.js";

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin), (req, res) => {
    res.json({ message:` Welcome School Admin: ${req.user.id} `});
});

router.post('/addSchool',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin),upload.single('logo'),addSchool)

router.post('/addTeacher',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin),addTeacher)
router.post('/addStudent',authenticate,authorizeRoles(Role.SchoolAdmin),addStudent)

router.post('/createForm',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),createForm)
router.post('/editForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),editForm)
router.delete('/deleteForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),deleteForm)

router.get('/stats', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin), getStats);
router.get('/stats/monthly', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin), getMonthlyStats);
router.get('/stats/pointsgiven', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin), getPointsGivenPerMonth);
router.get('/stats/pointsgiven/:teacherId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin), getPointsGivenPerMonthPerTeacher);
router.get('/stats/pointsreceived/:studentId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.Student, Role.SystemAdmin, Role.Admin), getPointsReceivedPerMonth);
router.get('/stats/formsubmitted', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin), getFormsSubmittedPerMonth);
router.get('/stats/formsubmitted/:teacherId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin), getFormsSubmittedPerMonthPerTeacher);

router.post('/stats/reportdata', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin), getCombinedStudentPointsHistory);
router.post('/stats/reportdata/:id', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin), getStudentPointsHistory);
router.put('/resetStudentRoster', authenticate, authorizeRoles(Role.SchoolAdmin), resetStudentRoster);

// OTP routes for reset confirmation
router.post('/sendResetOtp', authenticate, authorizeRoles(Role.SchoolAdmin), sendResetOtp);
router.post('/verifyResetOtp', authenticate, authorizeRoles(Role.SchoolAdmin), verifyResetOtp);
router.post('/sendreport/:email', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Admin, Role.SystemAdmin), upload.single('file'), sendReport);
router.post('/genreport/:email', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Admin, Role.SystemAdmin), upload.single('file'), genreport);
router.post('/teacher-roster', authenticate, authorizeRoles(Role.SchoolAdmin), teacherRoster);
router.post('/student-roster', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher), studentRoster);

export default router;