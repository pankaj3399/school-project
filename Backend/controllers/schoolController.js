import { Role } from "../enum.js";
import School from "../models/School.js";
import { uploadImageFromDataURI } from "../utils/cloudinary.js"
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";
export const getAllSchools = async (req, res) => {
    try {
      const schools = await School.find();
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
        // School admin sees all students
        const school = await School.findOne({ createdBy: req.user.id });
        if(school) {
          students = await Student.find({ schoolId: school._id });
        } else {
          // Fallback if school not found by createdBy, maybe check Admin record
          const adminUser = await Admin.findById(req.user.id);
          if (adminUser && adminUser.schoolId) {
            students = await Student.find({ schoolId: adminUser.schoolId });
          }
        }
      } else if (req.user.role === Role.SystemAdmin || req.user.role === Role.Admin) {
        console.log("System admin - all students (optionally filtered by schoolId query)");
        // System admin can see all students or filter by schoolId if provided in query
        const { schoolId } = req.query;
        const filter = schoolId ? { schoolId } : {};
        students = await Student.find(filter);
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
        } else if (req.user.role === Role.SystemAdmin || req.user.role === Role.Admin) {
            const { schoolId: querySchoolId } = req.query; // Rename to avoid conflict
            const filter = querySchoolId ? { schoolId: querySchoolId } : {};
            teachers = await Teacher.find(filter);
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
                sch = await School.findOne({ createdBy: req.user.id }).populate('createdBy');
                break;
            case Role.SystemAdmin:
            case Role.Admin:
                // For system admins, look for schoolId in query
                const { schoolId: querySchoolId } = req.query;
                if (!querySchoolId) {
                    return res.status(400).json({ message: 'School ID is required for System Administrators' });
                }
                sch = await School.findById(querySchoolId).populate('createdBy');
                break;
        }

        if (!sch) {
            return res.status(404).json({ message: 'School not found' });
        }
        return res.status(200).json({ school: sch });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'An error occurred', error: err.message });
    }
};

export const updateSchool = async (req, res) => {
    const { name, address, district, state, country, timeZone, domain } = req.body;
    const logo = req.file;
  
    try {
      let logoUrl = null;
      if(logo)
        logoUrl = await uploadImageFromDataURI(logo);
      let updatedSchool;
      if(logoUrl)
       updatedSchool = await School.findByIdAndUpdate(
        req.params.id,
        { name, address,district, logo: logoUrl, state, country, timeZone, domain },
        { new: true }
      ).populate('createdBy');
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
   
    try{
        const school = await School.findByIdAndDelete(req.params.id)
        if(!school){
            return res.status(404).json({ message: 'School not found' });
        }
        await Admin.findByIdAndUpdate(school.createdBy, {
            schoolId: null
        })
        return res.status(200).json({
            message:"School Deleted Successfully",
            school
        })
    }catch(error){
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
}

export const promote = async (req, res) => {
  try {
      const id = req.user.id;
      let school;
      
      // Get school based on user role
      if (req.user.role === Role.SystemAdmin || req.user.role === Role.Admin) {
          const { schoolId } = req.query.schoolId ? req.query : req.body;
          if (!schoolId) {
              return res.status(400).json({ message: 'School ID is required for System Administrators' });
          }
          school = await School.findById(schoolId);
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