import express from 'express';
import { subscribeToWaitlist } from '../controllers/waitlistController.js';

const router = express.Router();

// Public route - no authentication required
router.post('/', subscribeToWaitlist);

export default router;
