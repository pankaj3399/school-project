import School from "../models/School.js";

export const getDynamicSignature = async (schoolId) => {
  const school = await School.findById(schoolId)
    .populate("createdBy", "name email")
    .populate("districtId", "name state country");

  const linkedDistrict = school?.districtId && typeof school.districtId === "object"
    ? school.districtId
    : null;
  // The legacy string was backfilled as "Legacy Schools District" for schools
  // that later got a real district link. The linked district is the source of truth.
  const legacyName = typeof school?.district === "string" ? school.district.trim() : "";
  const legacyPlaceholder = /legacy schools? district/i.test(legacyName);
  const districtName = linkedDistrict?.name || (!legacyPlaceholder ? legacyName : "") || legacyName;

  const address = [school?.address, school?.city].filter(Boolean).join(", ");

  return {
    name: school?.createdBy?.name || school?.createdBy?.email || "The RADU Team",
    schoolName: school?.name || "Your School",
    address,
    district: districtName,
    state: school?.state || linkedDistrict?.state || "",
    country: school?.country || linkedDistrict?.country || ""
  };
};
