import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles('Teacher'), (req, res) => {
    res.json({ message: `Welcome Teacher: ${req.user.id}` });
});

export default router;
