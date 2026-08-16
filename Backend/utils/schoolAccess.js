import { Role } from "../enum.js";
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import School from "../models/School.js";

export function httpError(message, status = 403) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function requestedSchoolId(req) {
  return req.query?.schoolId || req.body?.schoolId || req.get?.("schoolId") || null;
}

function isSystemAdminUser(req, admin) {
  return req.user.role === Role.SystemAdmin || admin?.role === Role.SystemAdmin;
}

export function isDistrictScopedRole(role) {
  return role === Role.Admin || role === Role.DistrictAdmin;
}

/**
 * Throws if the authenticated user cannot access the given school.
 */
export async function assertSchoolAccess(req, schoolId) {
  if (!schoolId) {
    throw httpError("School context is required.", 400);
  }

  const role = req.user.role;

  if (role === Role.SystemAdmin) {
    const school = await School.findById(schoolId).select("_id");
    if (!school) throw httpError("School not found.", 404);
    return;
  }

  if (isDistrictScopedRole(role)) {
    const admin = await Admin.findById(req.user.id).select("districtId role");
    if (isSystemAdminUser(req, admin)) {
      const school = await School.findById(schoolId).select("_id");
      if (!school) throw httpError("School not found.", 404);
      return;
    }
    if (!admin?.districtId) {
      throw httpError("Administrator is not assigned to a district.");
    }
    const school = await School.findOne({
      _id: schoolId,
      districtId: admin.districtId,
    }).select("_id");
    if (!school) {
      throw httpError("Access denied. School is outside your district.");
    }
    return;
  }

  if (role === Role.SchoolAdmin) {
    const admin = await Admin.findById(req.user.id).select("schoolId");
    if (!admin?.schoolId || admin.schoolId.toString() !== schoolId.toString()) {
      throw httpError("Access denied. You can only access your assigned school.");
    }
    return;
  }

  if (role === Role.Teacher) {
    const teacher = await Teacher.findById(req.user.id).select("schoolId");
    if (!teacher?.schoolId || teacher.schoolId.toString() !== schoolId.toString()) {
      throw httpError("Access denied. You can only access your assigned school.");
    }
    return;
  }

  if (role === Role.Student) {
    const student = await Student.findById(req.user.id).select("schoolId");
    if (!student?.schoolId || student.schoolId.toString() !== schoolId.toString()) {
      throw httpError("Access denied. You can only access your own school.");
    }
    return;
  }

  throw httpError("Access denied. You do not have the required permissions.");
}

/**
 * School check plus Lead-teacher grade and student-self rules.
 */
export async function assertStudentAccess(req, student) {
  if (!student) {
    throw httpError("Student not found.", 404);
  }

  await assertSchoolAccess(req, student.schoolId);

  if (req.user.role === Role.Teacher) {
    const teacher = await Teacher.findById(req.user.id).select("type grade");
    if (teacher?.type === "Lead" && String(student.grade) !== String(teacher.grade)) {
      throw httpError("Access denied. Lead teachers can only manage students in their grade.");
    }
  }

  if (req.user.role === Role.Student && student._id.toString() !== req.user.id) {
    throw httpError("Access denied. You can only view your own records.");
  }
}

/**
 * Mongo filter limited to schools the user may see.
 * Superuser with no schoolId: all schools.
 * District roles with no schoolId: every school in their district.
 */
export async function resolveSchoolListFilter(req, { schoolIdRequired = false } = {}) {
  const role = req.user.role;
  const schoolId = requestedSchoolId(req);

  if (role === Role.SystemAdmin) {
    if (schoolId) {
      await assertSchoolAccess(req, schoolId);
      return { schoolId };
    }
    if (schoolIdRequired) {
      throw httpError("schoolId is required. Select a school.", 400);
    }
    return {};
  }

  if (isDistrictScopedRole(role)) {
    const admin = await Admin.findById(req.user.id).select("districtId role");
    if (isSystemAdminUser(req, admin)) {
      if (schoolId) {
        await assertSchoolAccess(req, schoolId);
        return { schoolId };
      }
      if (schoolIdRequired) {
        throw httpError("schoolId is required. Select a school.", 400);
      }
      return {};
    }
    if (!admin?.districtId) {
      throw httpError("Administrator is not assigned to a district.");
    }
    if (schoolId) {
      await assertSchoolAccess(req, schoolId);
      return { schoolId };
    }
    if (schoolIdRequired) {
      throw httpError("schoolId is required. Select a school.", 400);
    }
    const schools = await School.find({ districtId: admin.districtId }).select("_id");
    return { schoolId: { $in: schools.map((s) => s._id) } };
  }

  if (role === Role.SchoolAdmin) {
    const admin = await Admin.findById(req.user.id).select("schoolId");
    if (!admin?.schoolId) {
      throw httpError("School Tech is not assigned to a school.");
    }
    return { schoolId: admin.schoolId };
  }

  if (role === Role.Teacher) {
    const teacher = await Teacher.findById(req.user.id).select("schoolId");
    if (!teacher?.schoolId) {
      throw httpError("Teacher is not assigned to a school.");
    }
    return { schoolId: teacher.schoolId };
  }

  throw httpError("Forbidden.");
}
