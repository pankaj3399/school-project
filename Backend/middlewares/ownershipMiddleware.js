import { Role } from "../enum.js";

/**
 * Middleware to ensure a DistrictAdmin only accesses their own district data.
 * Applied to routes with :id parameter representing a District ID.
 */
export const ensureDistrictOwnership = (req, res, next) => {
  const { role, districtId: userDistrictId } = req.user;
  const { id: targetDistrictId } = req.params;

  if (role === Role.DistrictAdmin) {
    if (userDistrictId.toString() !== targetDistrictId) {
      return res.status(403).json({ 
        message: "Access denied. You can only manage your own district." 
      });
    }
  }

  next();
};
