import { addSchool, addStudent,  getFormsSubmittedPerMonth, getFormsSubmittedPerMonthPerTeacher, getMonthlyStats, getPointsGivenPerMonth, getPointsGivenPerMonthPerTeacher, getPointsReceivedPerMonth, getStats, resetStudentRoster, sendReport, genreport, teacherRoster, studentRoster } from "../controllers/schoolAdminController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { createForm, editForm, deleteForm } from "../controllers/formController.js";
import upload from "../middlewares/multer.js";
import { getCombinedStudentPointsHistory, getStudentPointsHistory } from "../controllers/pointhistoryController.js";
import { addTeacher } from "../controllers/teacherController.js";

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

router.post('/stats/reportdata', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher), getCombinedStudentPointsHistory);
router.post('/stats/reportdata/:id', authenticate, authorizeRoles(Role.SchoolAdmin, Role.Teacher), getStudentPointsHistory);
router.put('/resetStudentRoster', authenticate, authorizeRoles(Role.SchoolAdmin), resetStudentRoster);
router.post('/sendreport/:email', upload.single('file'), sendReport);
router.post('/genreport/:email', authenticate,upload.single('file'), genreport);
router.post('/teacher-roster', authenticate,authorizeRoles(Role.SchoolAdmin), teacherRoster);
router.post('/student-roster', authenticate, studentRoster);

export default router;