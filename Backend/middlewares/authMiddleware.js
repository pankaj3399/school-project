import jwt from 'jsonwebtoken';

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

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};
