import jwt from 'jsonwebtoken';
import { Role } from '../enum.js';
import Teacher from '../models/Teacher.js';

export const authenticate = (req, res, next) => {
    const token = req.headers.token;
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Alias for authenticate (used in new routes)
export const authenticateToken = authenticate;

// Role-based authorization middleware
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!req.user.role) {
            return res.status(403).json({ message: 'User role not found' });
        }

        // Role.SystemAdmin has global, unscoped access across the platform.
        // Role.Admin (District Manager) access is explicitly scoped by districtId within each controller.
        const globalRoles = [Role.SystemAdmin];
        if (globalRoles.includes(req.user.role)) {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. You do not have the required permissions.",
            });
        }

        next();
    };
};

/**
 * Team Members (Teacher with type !== Lead) only have Forms in the menu.
 * Call this after authenticate + authorizeRoles on any route that is not
 * form list/read/submit or the student picker used to submit a form.
 * Other roles pass through unchanged.
 */
export const requireLeadIfTeacher = async (req, res, next) => {
    if (req.user?.role !== Role.Teacher) {
        return next();
    }

    try {
        const teacher = await Teacher.findById(req.user.id).select('type');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        if (teacher.type !== 'Lead') {
            return res.status(403).json({
                message: 'Access denied. This action is not available for Team Members.',
            });
        }
        return next();
    } catch (err) {
        return res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
