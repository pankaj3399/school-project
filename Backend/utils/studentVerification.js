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

    // Check if parent emails are verified (if form requires parent notifications)
    if (form.parentEmail && student.parentEmail && !student.isParentOneEmailVerified) {
      return {
        eligible: false,
        error: "Cannot perform operations on students with unverified parent emails."
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