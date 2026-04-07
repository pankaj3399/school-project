import { Role } from "../enum.js";
import bcrypt from "bcryptjs";
import School from "../models/School.js";
import { uploadImageFromDataURI } from "../utils/cloudinary.js"
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";
export const getAllSchools = async (req, res) => {
    try {
      let filter = {};
      if (req.user.role === Role.Admin) {
        const adminUser = await Admin.findById(req.user.id);
        if (!adminUser || (adminUser.role !== Role.SystemAdmin && !adminUser.districtId)) {
          return res.status(403).json({ message: "Access denied. You are not assigned to a district." });
        }

        if (adminUser.role === Role.SystemAdmin) {
          filter = {};
        } else {
          filter = { districtId: adminUser.districtId };
        }
      }
      const schools = await School.find(filter).populate('districtId').populate('createdBy');
      res.status(200).json({ message: "Schools fetched successfully", schools });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  export const getStudents = async (req, res) => {
    try {
      console.log("=== getStudents DEBUG ===");
      console.log("User ID:", req.user.id);
      console.log("User role:", req.user.role);

      let students = [];
      if(req.user.role === Role.Teacher) {
        const teacher = await Teacher.findById(req.user.id);
        console.log("Teacher found:", teacher);
        if(!teacher) {
          return res.status(404).json({ error: "Teacher record not found" });
        }
        if(teacher.type === 'Lead') {
          console.log("Lead teacher - filtering by grade:", teacher.grade);
          // Lead teachers only see their grade's students
          students = await Student.find({
            schoolId: teacher.schoolId,
            grade: teacher.grade
          });
        } else {
          console.log("Special teacher - all students in school");
          // Special teachers see all students
          students = await Student.find({ schoolId: teacher.schoolId });
        }
      } else if (req.user.role === Role.SchoolAdmin) {
        console.log("School admin - all students");
        const adminUser = await Admin.findById(req.user.id);
        if (adminUser && adminUser.schoolId) {
          students = await Student.find({ schoolId: adminUser.schoolId });
        } else {
          // Fallback to searching for school created by this user
          const school = await School.findOne({ createdBy: req.user.id });
          if (school) {
            students = await Student.find({ schoolId: school._id });
          }
        }
      } else if (req.user.role === Role.SystemAdmin) {
        console.log("System admin - all students (optionally filtered by schoolId query)");
        const { schoolId } = req.query;
        const filter = schoolId ? { schoolId } : {};
        students = await Student.find(filter);
      } else if (req.user.role === Role.Admin) {
        console.log("Admin - district scoped students");
        const adminUser = await Admin.findById(req.user.id);
        
        if (!adminUser || (adminUser.role !== Role.SystemAdmin && !adminUser.districtId)) {
          return res.status(403).json({ message: "Admin is not assigned to a district." });
        }

        const { schoolId } = req.query;
        if (schoolId) {
          // Verify school belongs to admin's district
          const school = await School.findOne({ _id: schoolId, districtId: adminUser.districtId });
          if (!school) return res.status(403).json({ message: "Access denied to school outside your district." });
          students = await Student.find({ schoolId });
        } else {
          // Find all schools in admin's district
          const schools = await School.find({ districtId: adminUser.districtId });
          const schoolIds = schools.map(s => s._id);
          students = await Student.find({ schoolId: { $in: schoolIds } });
        }
      }
      console.log("Students found:", students.length);
      return res.status(200).json({ students });
    } catch (err) {
      console.error("Error in getStudents:", err);
      return res.status(500).json({ error: err.message });
    }
  };


export const getTeachers = async (req, res) => {
    try {
        let teachers = [];
        let schoolId = null; // Declare schoolId here
        if (req.user.role === Role.Teacher) {
            const teacher = await Teacher.findById(req.user.id);
            if (!teacher) {
                return res.status(404).json({ error: "Teacher record not found" });
            }
            schoolId = teacher.schoolId;
        } else if (req.user.role === Role.SchoolAdmin) {
            const schoolAdmin = await Admin.findById(req.user.id); // Changed to Admin.findById
            if (!schoolAdmin) {
                return res.status(404).json({ error: "Admin record not found" });
            }
            schoolId = schoolAdmin.schoolId;
        } else if (req.user.role === Role.SystemAdmin) {
            const { schoolId: querySchoolId } = req.query;
            const filter = querySchoolId ? { schoolId: querySchoolId } : {};
            teachers = await Teacher.find(filter);
        } else if (req.user.role === Role.Admin) {
            const adminUser = await Admin.findById(req.user.id);
            if (!adminUser || (adminUser.role !== Role.SystemAdmin && !adminUser.districtId)) {
                return res.status(403).json({ message: "Admin is not assigned to a district." });
            }
            
            const { schoolId: querySchoolId } = req.query;
            if (querySchoolId) {
                const school = await School.findOne({ _id: querySchoolId, districtId: adminUser.districtId });
                if (!school) return res.status(403).json({ message: "Access denied to school outside your district." });
                teachers = await Teacher.find({ schoolId: querySchoolId });
            } else {
                const schools = await School.find({ districtId: adminUser.districtId });
                const schoolIds = schools.map(s => s._id);
                teachers = await Teacher.find({ schoolId: { $in: schoolIds } });
            }
        }
        
        // If schoolId was determined for Teacher or SchoolAdmin, find teachers
        if (schoolId) {
            teachers = await Teacher.find({ schoolId: schoolId });
        }

        return res.status(200).json({ teachers: teachers });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};
export const getCurrentSchool = async (req, res) => {
    try {
       

        let sch;
        switch(req.user.role) {
            case Role.Teacher:
                const teacher = await Teacher.findById(req.user.id);
                sch = await School.findOne({ _id: teacher.schoolId }).populate('createdBy');
                break;
            case Role.SchoolAdmin:
                const schoolAdmin = await Admin.findById(req.user.id);
                if (!schoolAdmin || !schoolAdmin.schoolId) {
                  return res.status(403).json({ message: "Access denied. No school assigned or admin not found." });
                }
                sch = await School.findById(schoolAdmin.schoolId).populate('districtId').populate('createdBy');
                break;
            case Role.SystemAdmin:
                // For system admins, look for schoolId in query
                const { schoolId: querySchoolId } = req.query;
                if (!querySchoolId) {
                    return res.status(400).json({ message: 'School ID is required for System Administrators' });
                }
                sch = await School.findById(querySchoolId).populate('districtId').populate('createdBy');
                break;
            case Role.Admin:
                const adminUser = await Admin.findById(req.user.id);
                if (!adminUser) return res.status(403).json({ message: "Admin user not found." });
                
                if (adminUser.role === Role.SystemAdmin) {
                  const { schoolId: saSchoolId } = req.query;
                  if (!saSchoolId) return res.status(400).json({ message: 'School ID is required for System Administrators' });
                  sch = await School.findById(saSchoolId).populate('districtId').populate('createdBy');
                } else if (adminUser.districtId) {
                  const { schoolId: dSchoolId } = req.query;
                  if (!dSchoolId) return res.status(400).json({ message: 'School ID is required for Administrators' });
                  sch = await School.findOne({ _id: dSchoolId, districtId: adminUser.districtId }).populate('districtId').populate('createdBy');
                  if (!sch) return res.status(403).json({ message: "Access denied to school outside your district." });
                } else {
                  return res.status(403).json({ message: 'Admin is not assigned to a district' });
                }
                break;
        }

        if (!sch) {
            return res.status(404).json({ message: 'School not found' });
        }
        
        // Fetch administrators associated with this school
        // Whitelist safe fields to avoid leaking hashes or sensitive info
        const adminsRaw = await Admin.find({ schoolId: sch._id })
            .select('_id name email role createdAt')
            .lean();
            
        const admins = adminsRaw.map(admin => ({
            ...admin,
            hasCompletedRegistration: !!admin.password // Note: password is deleted/excluded in projection, but we calculate this boolean before exclusion if needed or from doc
        }));
        
        // Final mapping to ensure no accidental leaks and provide the boolean
        const adminsWithStatus = await Promise.all(admins.map(async (a) => {
            const fullAdmin = await Admin.findById(a._id).select('password');
            return {
                ...a,
                hasCompletedRegistration: !!(fullAdmin && fullAdmin.password)
            };
        }));

        return res.status(200).json({ school: sch, admins: adminsWithStatus });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};

export const updateSchool = async (req, res) => {
    const { name, address, district, state, country, timeZone, domain } = req.body;
    const logo = req.file;
  
    try {
      // Role-based access control
      if (req.user.role === Role.Admin) {
        const adminUser = await Admin.findById(req.user.id);
        const school = await School.findById(req.params.id);
        const adminDistrictId = adminUser.districtId?.toString() || "";
        const schoolDistrictId = school.districtId?.toString() || "";
        if (!adminUser || !school || schoolDistrictId !== adminDistrictId) {
          return res.status(403).json({ message: "Access denied. School is outside your district." });
        }
      } else if (req.user.role === Role.SchoolAdmin) {
        const adminUser = await Admin.findById(req.user.id);
        const school = await School.findById(req.params.id);
        const isCreator = school && school.createdBy.toString() === req.user.id;
        const isAssigned = adminUser && adminUser.schoolId && adminUser.schoolId.toString() === req.params.id;
        
        if (!isCreator && !isAssigned) {
           return res.status(403).json({ message: "Access denied. You can only update your own school." });
        }
      }
      // Note: SystemAdmin has global access
      let logoUrl = null;
      if(logo)
        logoUrl = await uploadImageFromDataURI(logo);
      let updatedSchool;
      if(logoUrl)
       updatedSchool = await School.findByIdAndUpdate(
        req.params.id,
        { name, address, district, districtId: req.body.districtId || undefined, logo: logoUrl, state, country, timeZone, domain },
        { new: true }
      ).populate('districtId').populate('createdBy');
      else
      updatedSchool = await School.findByIdAndUpdate(
        req.params.id,
        { name, address,district, state, country, timeZone, domain },
        { new: true }
      ).populate('createdBy');
  
      if (!updatedSchool) return res.status(404).json({ message: "School not found." });
  
      res.status(200).json({ message: "School updated successfully", school: updatedSchool });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

export const deleteSchool = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Administrator password is required for deletion." });
        }

        // Load administrator
        const adminUser = await Admin.findById(req.user.id);
        if (!adminUser) {
            return res.status(403).json({ message: "Admin account not found." });
        }

        // 1. Authorization check by role/scope FIRST
        if (req.user.role === Role.Admin) {
            if (adminUser.role !== Role.SystemAdmin) {
                if (!adminUser.districtId) {
                    return res.status(403).json({ message: "Admin is not assigned to a district." });
                }
                const schoolCheck = await School.findById(schoolId);
                if (!schoolCheck || (schoolCheck.districtId && schoolCheck.districtId.toString() !== adminUser.districtId.toString())) {
                    return res.status(403).json({ message: "Access denied. School is outside your district." });
                }
            }
        } else if (req.user.role === Role.SchoolAdmin) {
            const school = await School.findById(schoolId);
            const isCreator = school && school.createdBy && school.createdBy.toString() === req.user.id;
            const isAssigned = adminUser.schoolId && adminUser.schoolId.toString() === schoolId;
            
            if (!isCreator && !isAssigned) {
                return res.status(403).json({ message: "Access denied. You can only delete schools you created or are assigned to." });
            }
        } else if (req.user.role !== Role.SystemAdmin) {
            // Explicitly reject unsupported roles if they reached this point
            return res.status(403).json({ message: "Access denied. Unauthorized role for this action." });
        }

        // 2. Verify administrator's password after authorization checks
        if (!adminUser.password) {
            return res.status(403).json({ message: "Password not set for this account." });
        }

        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password. School deletion aborted." });
        }

        // Check for associated teachers
        const teacherCount = await Teacher.countDocuments({ schoolId });
        if (teacherCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete school with ${teacherCount} associated teachers. Please remove all teachers first.` 
            });
        }

        // Check for associated students
        const studentCount = await Student.countDocuments({ schoolId });
        if (studentCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete school with ${studentCount} associated students. Please remove all students first.` 
            });
        }

        // Check for associated school admins
        const adminCount = await Admin.countDocuments({ schoolId, role: Role.SchoolAdmin });
        if (adminCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete school with ${adminCount} associated school administrators. Please remove all school admins first.` 
            });
        }

        const school = await School.findByIdAndDelete(schoolId);
        if(!school){
            return res.status(404).json({ message: 'School not found' });
        }
        
        // Cleanup Admin reference if the creator was the primary admin
        if (school.createdBy) {
            await Admin.findByIdAndUpdate(school.createdBy, {
                schoolId: null
            });
        }

        return res.status(200).json({
            message: "School Deleted Successfully",
            school
        });
    } catch(error) {
        console.error("Error in deleteSchool:", error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const promote = async (req, res) => {
  try {
      const id = req.user.id;
      let school;
      
      // Get school based on user role
      if (req.user.role === Role.SystemAdmin) {
          const { schoolId } = req.query.schoolId ? req.query : req.body;
          if (!schoolId) {
              return res.status(400).json({ message: 'School ID is required for System Administrators' });
          }
          school = await School.findById(schoolId);
          } else if (req.user.role === Role.Admin) {
          const adminUser = await Admin.findById(id);
          if (!adminUser || (adminUser.role !== Role.SystemAdmin && !adminUser.districtId)) {
            return res.status(403).json({ message: "Admin is not assigned to a district." });
          }
          const { schoolId } = req.query.schoolId ? req.query : req.body;
          if (!schoolId) {
              return res.status(400).json({ message: 'School ID is required for Administrators' });
          }
          school = await School.findOne({ _id: schoolId, districtId: adminUser.districtId });
          if (!school) return res.status(403).json({ message: "Access denied. School is outside your district." });
      } else if(req.user.role === Role.Teacher) {
          const user = await Teacher.findById(id);
          school = await School.findById(user.schoolId);
      } else {
          school = await School.findOne({ createdBy: id });
      }

      if(!school) {
          return res.status(404).json({ message: 'School not found' });
      }

      // Get all students except those in grade 6
      const students = await Student.find({ 
          schoolId: school._id,
          grade: { $lt: 12 } 
      });

      // Promote students
      await Student.updateMany(
          { 
              _id: { $in: students.map(s => s._id) },
              grade: { $lt: 12 }
          },
          { $inc: { grade: 1 } }
      );

      return res.status(200).json({
          message: "Students promoted successfully",
          promotedCount: students.length
      });
  } catch(error) {
      return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}