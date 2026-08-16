import Student from "../models/Student.js";

export const checkStudentFormEligibility = async (studentId, form, options = {}) => {
  try {
    const student = await Student.findById(studentId);
    
    if (!student) {
      return {
        eligible: false,
        error: "Student not found"
      };
    }

    if (form?.schoolId && student.schoolId?.toString() !== form.schoolId.toString()) {
      return {
        eligible: false,
        error: "Access denied. Student does not belong to this form's school."
      };
    }

    if (options.schoolId && student.schoolId?.toString() !== options.schoolId.toString()) {
      return {
        eligible: false,
        error: "Access denied. Student is not in your school."
      };
    }

    if (!student.isStudentEmailVerified) {
      return {
        eligible: false,
        error: "Cannot perform operations on unverified students. Student email must be verified first."
      };
    }


    return {
      eligible: true,
      student: student
    };
  } catch (error) {
    return {
      eligible: false,
      error: "Error checking student form eligibility"
    };
  }
};