import { addStudent,updateStudent,deleteStudent } from "../controllers/studentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import validateZod from '../middlewares/validateZod.js';
import { addStudentSchema, updateStudentSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.Student), (req, res) => {
    res.json({ message: `Welcome School Student: ${req.user.id}` });
});

router.post('/addStudent',authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher),validateZod(addStudentSchema),addStudent)
router.put("/updateStudent/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher), validateZod(updateStudentSchema), updateStudent)
router.delete("/deleteStudent/:id",authenticate,authorizeRoles(Role.SchoolAdmin, Role.Teacher), deleteStudent)



export default router;
