import express from 'express';
import { getAllSchools, getStudents, getTeachers,getCurrentSchool,updateSchool,deleteSchool, promote } from '../controllers/schoolController.js';
import { authenticateToken as authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import {Role} from '../enum.js';
import upload from '../middlewares/multer.js';
import { getWeekPointsHistory, getYearPointsHistory, getHistoricalPointsData, getYearPointsHistoryByStudent, getWeekPointsHistoryByStudent, getHistoricalPointsDataByStudentId, getAnalyticsData } from '../controllers/pointhistoryController.js';
const router = express.Router();

router.get('/', authenticate, authorizeRoles(Role.SystemAdmin, Role.Admin, Role.DistrictAdmin), getAllSchools);
router.get('/students',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getStudents);
router.get('/teachers',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getTeachers);
router.get('/school',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getCurrentSchool);
router.put('/updateSchool/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),upload.single('logo'),updateSchool);
router.delete('/deleteSchool/:id',authenticate,authorizeRoles(Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),deleteSchool);
router.post('/getYearPointsHistory',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getYearPointsHistory);
router.post('/getYearPointsHistory/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getYearPointsHistoryByStudent);
router.post('/getCurrentWeekPoints',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getWeekPointsHistory);
router.post('/getCurrentWeekPoints/:id',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getWeekPointsHistoryByStudent);
router.post('/getHistoryByTime',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getHistoricalPointsData);
router.post('/getHistoryByTimeById',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getHistoricalPointsDataByStudentId);
router.post('/analytics',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),getAnalyticsData);
router.put('/promote',authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin, Role.DistrictAdmin),promote);




export default router;