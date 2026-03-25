import { addStudent,updateStudent,deleteStudent } from "../controllers/studentController.js";
import { authenticateToken as authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.Student), async (req, res) => {
    res.json({ message: `Welcome School Student: ${req.user.id}` });
});

router.post('/addStudent',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin),addStudent)
router.put("/updateStudent/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin), updateStudent)
router.delete("/deleteStudent/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher, Role.SystemAdmin, Role.Admin), deleteStudent)



export default router;
