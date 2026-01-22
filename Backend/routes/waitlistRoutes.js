import express from 'express';
import { subscribeToWaitlist, exportWaitlistData } from '../controllers/waitlistController.js';

import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { Role } from '../enum.js';

const router = express.Router();

// Public route - no authentication required
router.post('/', subscribeToWaitlist);

// Admin route - download waitlist csv
router.get('/export', authenticate, authorizeRoles(Role.Admin, Role.SchoolAdmin), exportWaitlistData);

export default router;
