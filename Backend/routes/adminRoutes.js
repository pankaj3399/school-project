import express from 'express';
import { authenticateToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import {Role} from '../enum.js';
const router = express.Router();

router.get('/dashboard', authenticateToken, authorizeRoles(), (req, res) => {
    res.json({ message:` Welcome System Admin: ${req.user.id} `});
});

export default router;