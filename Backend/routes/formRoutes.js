import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import express from 'express';
import {Role} from '../enum.js';
import { getForms } from "../controllers/formController.js";

const router = express.Router();

router.get('/getForms',authenticate,authorizeRoles(Role.SchoolAdmin,Role.Teacher, Role.Student),getForms)



export default router;