import { Role } from "../enum.js";
import Admin from "../models/Admin.js";

/**
 * District Manager (Admin) and District Admin may only touch their assigned
 * district. Scope is taken from the database, not the JWT claim.
 */
export const ensureDistrictOwnership = async (req, res, next) => {
  try {
    const { role } = req.user;
    const { id: targetDistrictId } = req.params;

    if (role === Role.SystemAdmin) {
      return next();
    }

    if (role !== Role.Admin && role !== Role.DistrictAdmin) {
      return next();
    }

    const admin = await Admin.findById(req.user.id).select("districtId");
    if (!admin?.districtId) {
      return res.status(403).json({
        message: "Administrator is not assigned to a district.",
      });
    }

    if (admin.districtId.toString() !== String(targetDistrictId)) {
      return res.status(403).json({
        message: "Access denied. You can only manage your own district.",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: "Error verifying district access", error: error.message });
  }
};
