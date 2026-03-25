import express from 'express';
import { authenticateToken as authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import { addTeacher,updateTeacher,deleteTeacher } from '../controllers/teacherController.js';
import { completeTeacherRegistration } from '../controllers/teacherController.js';
import {Role} from '../enum.js';
const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.Teacher), async (req, res) => {
    res.json({ message:` Welcome Teacher: ${req.user.id}` });
});

router.post("/addTeacher",authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin), addTeacher)
router.put("/updateTeacher/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin), updateTeacher)
router.delete("/deleteTeacher/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.SystemAdmin, Role.Admin), deleteTeacher)
router.post("/complete-registration", completeTeacherRegistration);

export default router;
