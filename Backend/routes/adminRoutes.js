import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorizeRoles('SystemAdmin'), (req, res) => {
    res.json({ message: `Welcome System Admin: ${req.user.id}` });
});

export default router;
