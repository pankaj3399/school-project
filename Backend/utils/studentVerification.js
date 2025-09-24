import Student from "../models/Student.js";

export const checkStudentFormEligibility = async (studentId, form) => {
  try {
    const student = await Student.findById(studentId);
    
    if (!student) {
      return {
        eligible: false,
        error: "Student not found"
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