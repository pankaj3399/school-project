import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import {Role} from '../enum.js';
const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles(Role.Admin), (req, res) => {
    res.json({ message:` Welcome System Admin: ${req.user.id} `});
});

export default router;