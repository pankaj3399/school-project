import { addSchool, addStudent, addTeacher } from "../controllers/schoolAdminController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles('SchoolAdmin'), (req, res) => {
    res.json({ message:` Welcome School Admin: ${req.user.id} `});
});

router.post('/addSchool',authenticate,authorizeRoles('SchoolAdmin'),addSchool)

router.post('/addTeacher',authenticate,authorizeRoles('SchoolAdmin'),addTeacher)
router.post('/addStudent',authenticate,authorizeRoles('SchoolAdmin'),addStudent)



export default router;