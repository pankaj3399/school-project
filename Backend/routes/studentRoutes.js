import { addStudent,updateStudent,deleteStudent } from "../controllers/studentController.js";
import { authenticateToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, authorizeRoles(Role.Student), (req, res) => {
    res.json({ message: `Welcome School Student: ${req.user.id}` });
});

router.post('/addStudent',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),addStudent)
router.put("/updateStudent/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher), updateStudent)
router.delete("/deleteStudent/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher), deleteStudent)



export default router;
