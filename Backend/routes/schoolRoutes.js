import express from 'express';
import { getAllSchools, getStudents, getTeachers,getCurrentSchool,updateSchool,deleteSchool, promote } from '../controllers/schoolController.js';
import { authenticateToken as authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import {Role} from '../enum.js';
import upload from '../middlewares/multer.js';
import { getWeekPointsHistory, getYearPointsHistory, getHistoricalPointsData, getYearPointsHistoryByStudent, getWeekPointsHistoryByStudent, getHistoricalPointsDataByStudentId, getAnalyticsData } from '../controllers/pointhistoryController.js';
const router = express.Router();

router.get('/', authenticate, getAllSchools);
router.get('/students',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getStudents);
router.get('/teachers',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin),getTeachers);
router.get('/school',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getCurrentSchool);
router.put('/updateSchool/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin),upload.single('logo'),updateSchool);
router.delete('/deleteSchool/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin),deleteSchool);
router.post('/getYearPointsHistory',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getYearPointsHistory);
router.post('/getYearPointsHistory/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getYearPointsHistoryByStudent);
router.post('/getCurrentWeekPoints',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getWeekPointsHistory);
router.post('/getCurrentWeekPoints/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getWeekPointsHistoryByStudent);
router.post('/getHistoryByTime',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getHistoricalPointsData);
router.post('/getHistoryByTimeById',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getHistoricalPointsDataByStudentId);
router.post('/analytics',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),getAnalyticsData);
router.put('/promote',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin),promote);




export default router;