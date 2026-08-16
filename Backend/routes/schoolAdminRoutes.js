import { addSchool, addStudent,  getFormsSubmittedPerMonth, getFormsSubmittedPerMonthPerTeacher, getMonthlyStats, getPointsGivenPerMonth, getPointsGivenPerMonthPerTeacher, getPointsReceivedPerMonth, getStats, resetPoints, resetStudentRoster, yearEndStudentWipe, sendReport, genreport, teacherRoster, studentRoster, sendResetOtp, verifyResetOtp } from "../controllers/schoolAdminController.js";
import { authenticateToken as authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { createForm, editForm, deleteForm } from "../controllers/formController.js";
import upload from "../middlewares/multer.js";
import { getCombinedStudentPointsHistory, getStudentPointsHistory } from "../controllers/pointhistoryController.js";
import { addTeacher } from "../controllers/teacherController.js";

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), (req, res) => {
    const roleLabel = req.user.role === Role.SystemAdmin ? "Admin" : req.user.role === Role.Admin ? "District Manager" : req.user.role === Role.DistrictAdmin ? "District Admin" : "School Tech";
    res.json({ message:` Welcome ${roleLabel}: ${req.user.id} `});
});

router.post('/addSchool',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),upload.single('logo'),addSchool)

router.post('/addTeacher',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),addTeacher)
router.post('/addStudent',authenticate,authorizeRoles(Role.SchoolAdmin),addStudent)

router.post('/createForm',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),createForm)
router.post('/editForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),editForm)
router.delete('/deleteForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),deleteForm)

router.get('/stats', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getStats);
router.get('/stats/monthly', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getMonthlyStats);
router.get('/stats/pointsgiven', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getPointsGivenPerMonth);
router.get('/stats/pointsgiven/:teacherId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getPointsGivenPerMonthPerTeacher);
router.get('/stats/pointsreceived/:studentId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.Student, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getPointsReceivedPerMonth);
router.get('/stats/formsubmitted', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getFormsSubmittedPerMonth);
router.get('/stats/formsubmitted/:teacherId', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getFormsSubmittedPerMonthPerTeacher);

router.post('/stats/reportdata', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getCombinedStudentPointsHistory);
router.post('/stats/reportdata/:id', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getStudentPointsHistory);
router.put('/resetPoints', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), resetPoints);
router.put('/resetStudentRoster', authenticate, authorizeRoles(Role.SchoolAdmin), resetStudentRoster);
router.put('/yearEndStudentWipe', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), yearEndStudentWipe);

// OTP routes for reset confirmation
router.post('/sendResetOtp', authenticate, authorizeRoles(Role.SchoolAdmin), sendResetOtp);
router.post('/verifyResetOtp', authenticate, authorizeRoles(Role.SchoolAdmin), verifyResetOtp);
router.post('/sendreport/:email', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Admin, Role.SystemAdmin), upload.single('file'), sendReport);
router.post('/genreport/:email', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Admin, Role.SystemAdmin), upload.single('file'), genreport);
router.post('/teacher-roster', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), teacherRoster);
router.post('/student-roster', authenticate, authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), studentRoster);

export default router;