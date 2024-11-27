import { addStudent } from "../controllers/studentController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles('Student'), (req, res) => {
    res.json({ message: `Welcome School Student: ${req.user.id}` });
});

router.post('/addStudent',addStudent)



export default router;