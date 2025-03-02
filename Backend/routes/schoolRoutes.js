import express from 'express';
import { getAllSchools, getStudents, getTeachers,getCurrentSchool,updateSchool,deleteSchool, promote } from '../controllers/schoolController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import {Role} from '../enum.js';
import upload from '../middlewares/multer.js';
import { getWeekPointsHistory, getYearPointsHistory, getHistoricalPointsData, getPointsByTeacher, getPointsByStudent, getYearPointsHistoryByStudent, getWeekPointsHistoryByStudent, getHistoricalPointsDataByStudentId } from '../controllers/pointhistoryController.js';
const router = express.Router();

router.get('/',getAllSchools);
router.get('/students',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getStudents);
router.get('/teachers',authenticate,authorizeRoles(Role.SchoolAdmin),getTeachers);
router.get('/school',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getCurrentSchool);
router.put('/updateSchool/:id',authenticate,authorizeRoles(Role.SchoolAdmin),upload.single('logo'),updateSchool);
router.delete('/deleteSchool/:id',authenticate,authorizeRoles(Role.SchoolAdmin),deleteSchool);
router.post('/getYearPointsHistory',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getYearPointsHistory);
router.post('/getYearPointsHistory/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getYearPointsHistoryByStudent);
router.post('/getCurrentWeekPoints',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getWeekPointsHistory);
router.post('/getCurrentWeekPoints/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getWeekPointsHistoryByStudent);
router.post('/getHistoryByTime',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getHistoricalPointsData);
router.post('/getHistoryByTimeById',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getHistoricalPointsDataByStudentId);
router.post('/getTeacherPoints',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getPointsByTeacher);
router.post('/getStudentPoints',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),getPointsByStudent);
router.put('/promote',authenticate,authorizeRoles(Role.SchoolAdmin),promote);




export default router;