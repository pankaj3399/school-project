//b
import { addSchool, addStudent, addTeacher } from "../controllers/schoolAdminController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { createForm, editForm, deleteForm } from "../controllers/formController.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.SchoolAdmin), (req, res) => {
    res.json({ message:` Welcome School Admin: ${req.user.id} `});
});

router.post('/addSchool',authenticate,authorizeRoles(Role.SchoolAdmin),upload.single('logo'),addSchool)

router.post('/addTeacher',authenticate,authorizeRoles(Role.SchoolAdmin),addTeacher)
router.post('/addStudent',authenticate,authorizeRoles(Role.SchoolAdmin),addStudent)

router.post('/createForm',authenticate,authorizeRoles(Role.SchoolAdmin),createForm)
router.post('/editForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin),editForm)
router.delete('/deleteForm/:id',authenticate,authorizeRoles(Role.SchoolAdmin),deleteForm)


export default router;