import School from "../models/School.js";

export const getDynamicSignature = async (schoolId) => {
  const school = await School.findById(schoolId).populate("createdBy", "name email");
  return {
    name: school?.createdBy?.name || school?.createdBy?.email || "The RADU Team",
    schoolName: school?.name || "Your School",
    address: school?.address || "",
    district: school?.district || "",
    state: school?.state || "",
    country: school?.country || ""
  };
};
