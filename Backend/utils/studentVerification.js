import Student from "../models/Student.js";

export const checkStudentVerification = async (studentId) => {
  try {
    const student = await Student.findById(studentId);
    
    if (!student) {
      return {
        verified: false,
        error: "Student not found"
      };
    }

    // Check if student email is verified
    if (!student.isStudentEmailVerified) {
      return {
        verified: false,
        error: "Student email is not verified. Student must verify their email before any operations can be performed."
      };
    }

    // Check if parent emails are verified (if they exist)
    if (student.parentEmail && !student.isParentOneEmailVerified) {
      return {
        verified: false,
        error: "Parent email is not verified. Parent must verify their email before any operations can be performed."
      };
    }

    if (student.standard && !student.isParentTwoEmailVerified) {
      return {
        verified: false,
        error: "Second parent email is not verified. Second parent must verify their email before any operations can be performed."
      };
    }

    return {
      verified: true,
      student: student
    };
  } catch (error) {
    return {
      verified: false,
      error: "Error checking student verification status"
    };
  }
};

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
        error: "Cannot perform operations on students with unverified parent emails. Parent email must be verified first."
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