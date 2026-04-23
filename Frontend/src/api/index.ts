import axios from "axios";
import { AnswerType, AnswerTypeArray } from "@/lib/types";

export const API_URL = import.meta.env.VITE_VERCEL
  ? import.meta.env.VITE_API_URL
  : import.meta.env.PROD
    ? "/api"
    : import.meta.env.VITE_API_URL;
console.log(
  import.meta.env,
  import.meta.env.PROD,
  import.meta.env.MODE,
  API_URL,
);

const getToken = () => localStorage.getItem("token");

export const signUp = async (data: {
  email: string;
  password: string;
  role: string;
  name: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, data);
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

// Updated API functions

export const signIn = async (data: { email: string; password: string; role: string; otp?: string }) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data;
  } catch (error: any) {
    // Pass through the specific error message from the backend
    return {
      error: {
        message: error?.response?.data?.message || error?.message || "Login failed",
        response: {
          data: error?.response?.data
        }
      }
    };
  }
};

export const requestLoginOtp = async ({ email, role, password }: { email: string; role: string; password: string }) => {
  try {
    const response = await axios.post(`${API_URL}/auth/request-login-otp`, { email, role, password });
    return response.data;
  } catch (error: any) {
    // Pass through the specific error message from the backend
    return {
      error: {
        message: error?.response?.data?.message || error?.message || "OTP request failed",
        response: {
          data: error?.response?.data
        }
      }
    };
  }
};

export const verifyLoginOtp = async ({ otp, email, role }: { otp: string; email: string; role: string }) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-login-otp`, { otp, email, role });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const addStudent = async (
  data: {
    email: string;
    password: string;
    standard: string;
    name: string;
    sendNotifications: boolean;
    parentEmail: string;
  },
  token: string,
) => {
  try {
    const response = await axios.post(`${API_URL}/student/addStudent`, data, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const updateStudent = async (
  data: Partial<{
    email: string;
    password: string;
    standard: string;
    name: string;
    parentEmail: string;
  }>,
  id: string,
  token: string,
) => {
  try {
    const response = await axios.put(
      `${API_URL}/student/updateStudent/${id}`,
      data,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const deleteStudent = async (id: string, token: string) => {
  try {
    const response = await axios.delete(
      `${API_URL}/student/deleteStudent/${id}`,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const addSchool = async (data: FormData, token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/schoolAdmin/addSchool`,
      data,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const addTeacher = async (
  data: {
    email: string;
    recieveMails: boolean;
    type: string;
    grade: string | null;
  },
  token: string,
) => {
  try {
    const response = await axios.post(`${API_URL}/teacher/addTeacher`, data, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const updateTeacher = async (
  data: Partial<{
    email: string;
    password: string;
    name: string;
    subject: string;
    recieveMails: boolean;
  }>,
  id: string,
  token: string,
) => {
  try {
    const response = await axios.put(
      `${API_URL}/teacher/updateTeacher/${id}`,
      data,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const deleteTeacher = async (id: string, token: string) => {
  try {
    const response = await axios.delete(
      `${API_URL}/teacher/deleteTeacher/${id}`,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getAllSchools = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/school/`, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const getStudents = async (token: string, schoolId?: string) => {
  try {
    const url = schoolId ? `${API_URL}/school/students?schoolId=${schoolId}` : `${API_URL}/school/students`;
    const response = await axios.get(url, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getCurrrentSchool = async (token: string, schoolId?: string) => {
  try {
    const url = schoolId ? `${API_URL}/school/school?schoolId=${schoolId}` : `${API_URL}/school/school`;
    const response = await axios.get(url, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getCurrentUser = async (token?: string) => {
  try {
    const storedToken = getToken();
    const response = await axios.get(`${API_URL}/user`, {
      headers: {
        token: token || storedToken,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const updateSchool = async (
  id: string,
  data: any,
  token: string,
) => {
  try {
    const response = await axios.put(
      `${API_URL}/school/updateSchool/${id}`,
      data,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const deleteSchool = async (id: string, token: string, password?: string) => {
  try {
    const response = await axios.delete(
      `${API_URL}/school/deleteSchool/${id}`,
      {
        headers: {
          token,
        },
        data: { password }
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getForms = async (token: string, schoolId?: string) => {
  try {
    const url = schoolId ? `${API_URL}/form/getForms?schoolId=${schoolId}` : `${API_URL}/form/getForms`;
    const response = await axios.get(url, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const createForm = async (data: any, token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/schoolAdmin/createForm`,
      data,
      {
        headers: { token },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const editForm = async (id: string, data: any, token: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/schoolAdmin/editForm/${id}`,
      data,
      {
        headers: { token },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const deleteForm = async (id: string, token: string) => {
  try {
    const response = await axios.delete(
      `${API_URL}/schoolAdmin/deleteForm/${id}`,
      {
        headers: { token },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getFormById = async (id: string, token: string) => {
  try {
    const response = await axios.get(`${API_URL}/form/getFormById/${id}`, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const submitFormTeacher = async (
  data: AnswerType,
  submittedFor: string,
  isSendEmail: {
    studentEmail: boolean;
    teacherEmail: boolean;
    schoolAdminEmail: boolean;
    parentEmail: boolean;
  },
  formId: string,
  token: string,
  submittedAt: Date,
) => {
  try {
    const answers: AnswerTypeArray = Object.entries(data).map(
      ([questionId, answer]) => ({
        questionId,
        answer: answer.answer,
        points: answer.points,
      }),
    );
    const response = await axios.post(
      `${API_URL}/form/submitFormTeacher/${formId}`,
      {
        answers,
        submittedFor,
        submittedAt,
        ...isSendEmail,
      },
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    // Extract the actual error message from axios response
    return {
      error: {
        message: error?.response?.data?.message || error?.message || "Form submission failed",
        response: {
          data: error?.response?.data
        }
      }
    };
  }
};

export const submitFormAdmin = async (
  data: AnswerType,
  submittedFor: string,
  isSendEmail: {
    studentEmail: boolean;
    teacherEmail: boolean;
    schoolAdminEmail: boolean;
    parentEmail: boolean;
  },
  formId: string,
  submittedAt: Date,
) => {
  try {
    const token = getToken();
    const answers: AnswerTypeArray = Object.entries(data).map(
      ([questionId, answer]) => ({
        questionId,
        answer: answer.answer,
        points: answer.points,
      }),
    );
    const response = await axios.post(
      `${API_URL}/form/submitFormAdmin/${formId}`,
      {
        answers,
        submittedFor,
        ...isSendEmail,
        submittedAt,
      },
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    // Extract the actual error message from axios response
    return {
      error: {
        message: error?.response?.data?.message || error?.message || "Form submission failed",
        response: {
          data: error?.response?.data
        }
      }
    };
  }
};

export const getPointHistory = async (token: string, page: number, limit: number = 20, schoolId?: string) => {
  try {
    const schoolParam = schoolId ? `&schoolId=${encodeURIComponent(schoolId)}` : '';
    const response = await axios.get(`${API_URL}/form/getPointHistory?page=${page}&limit=${limit}${schoolParam}`, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getFilteredPointHistory = async (token: string, studentId: string, schoolId?: string) => {
  try {
    const schoolParam = schoolId ? `&schoolId=${encodeURIComponent(schoolId)}` : '';
    const response = await axios.get(`${API_URL}/form/getFilteredPointHistory?studentId=${studentId}${schoolParam}`, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getStats = async (schoolId?: string, opts?: { studentId?: string; period?: string }) => {
  try {
    const token = getToken();
    const params = new URLSearchParams();
    if (schoolId) params.set("schoolId", schoolId);
    if (opts?.studentId) params.set("studentId", opts.studentId);
    if (opts?.period) params.set("period", opts.period);
    const qs = params.toString();
    const url = qs ? `${API_URL}/schoolAdmin/stats?${qs}` : `${API_URL}/schoolAdmin/stats`;
    const response = await axios.get(url, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const getMonthlyStats = async (schoolId?: string) => {
  try {
    const token = getToken();
    const url = schoolId ? `${API_URL}/schoolAdmin/stats/monthly?schoolId=${schoolId}` : `${API_URL}/schoolAdmin/stats/monthly`;
    const response = await axios.get(url, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const getPointsGivenPerMonth = async () => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_URL}/schoolAdmin/stats/pointsgiven`,
      { headers: { token } },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const getPointsGivenPerMonthPerTeacher = async (id: string) => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_URL}/schoolAdmin/stats/pointsgiven/${id}`,
      { headers: { token } },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getPointsReceivedPerMonth = async (id: string) => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_URL}/schoolAdmin/stats/pointsreceived/${id}`,
      { headers: { token } },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const getFormsSubmittedPerMonth = async () => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_URL}/schoolAdmin/stats/formsubmitted`,
      { headers: { token } },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getFormsSubmittedPerMonthPerTeacher = async (id: string) => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_URL}/schoolAdmin/stats/formsubmitted/${id}`,
      { headers: { token } },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getTeachers = async (schoolId?: string) => {
  try {
    const token = getToken();
    const url = schoolId ? `${API_URL}/school/teachers?schoolId=${schoolId}` : `${API_URL}/school/teachers`;
    const response = await axios.get(url, {
      headers: {
        token,
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const sendOtp = async ({
  email,
  role,
}: {
  email: string;
  role: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/auth/sendotp`, {
      email,
      role,
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const verifyOtp = async ({
  otp,
  email,
  role,
}: {
  email: string;
  role: string;
  otp: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify`, {
      otp,
      email,
      role,
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const resetPassword = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/auth/resetpassword`, {
      ...data,
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getHistoryOfYear = async (schoolId?: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/school/getYearPointsHistory`,
      { schoolId },
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getHistoryOfYearByStudent = async (id: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/school/getYearPointsHistory/${id}`,
      {},
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getReportDataStudentCombined = async (grades: string[], schoolId?: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/schoolAdmin/stats/reportdata`,
      {
        grades,
        ...(schoolId ? { schoolId } : {}),
      },
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getReportDataStudent = async (id: string, grade: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/schoolAdmin/stats/reportdata/${id}`,
      {
        grade,
      },
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getHistoryOfCurrentWeek = async (data: any) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/school/getCurrentWeekPoints`,
      data,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getHistoryOfCurrentWeekByStudent = async (
  id: string,
  data: any,
) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/school/getCurrentWeekPoints/${id}`,
      data,
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const getHistoryByTime = async (data: any) => {
  try {
    const token = getToken();
    let response;
    if (data.studentId) {
      response = await axios.post(
        `${API_URL}/school/getHistoryByTimeById`,
        data,
        {
          headers: {
            token,
          },
        },
      );
    } else {
      response = await axios.post(`${API_URL}/school/getHistoryByTime`, data, {
        headers: {
          token,
        },
      });
    }
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getAnalyticsData = async (data: { period: string; studentId?: string, schoolId?: string }) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/school/analytics`,
      data,
      {
        headers: {
          token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return { error };
  }
};

export const promote = async (schoolId?: string) => {
  try {
    const token = getToken();
    await axios.put(
      `${API_URL}/school/promote${schoolId ? `?schoolId=${schoolId}` : ''}`,
      {},
      {
        headers: {
          token,
          schoolId,
        },
      },
    );
    return { success: true };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const sendReport = async (data: FormData, email: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/schoolAdmin/sendReport/${email}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: token || "",
        },
      },
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const sendReportImage = async (data: FormData, email: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/schoolAdmin/genreport/${email}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: token || "",
        },
      },
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const sendVerificationMail = async (data: any) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/auth/sendVerificationMail`, data, {
      headers: {
        token,
      },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const sendConfirmation = async (data: any) => {
  try {
    const token = getToken();
    await axios.post(`${API_URL}/auth/completeVerification`, data, {
      headers: {
        token,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const sendResetOtp = async () => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/schoolAdmin/sendResetOtp`,
      {},
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const verifyResetOtp = async (otp: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/schoolAdmin/verifyResetOtp`,
      { otp },
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const resetStudentRoster = async (schoolId?: string) => {
  try {
    const token = getToken();
    await axios.put(
      `${API_URL}/schoolAdmin/resetStudentRoster${schoolId ? `?schoolId=${schoolId}` : ''}`,
      {},
      {
        headers: {
          token,
          schoolId,
        },
      },
    );
    return { success: true };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const resetPoints = async (schoolId?: string) => {
  try {
    const token = getToken();
    await axios.put(
      `${API_URL}/schoolAdmin/resetPoints${schoolId ? `?schoolId=${schoolId}` : ''}`,
      {},
      {
        headers: {
          token,
          schoolId,
        },
      },
    );
    return { success: true };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const teacherRoster = async (data: any) => {
  try {
    const url = `${window.location.origin}/verifyemail`;
    const token = getToken();
    await axios.post(
      `${API_URL}/schoolAdmin/teacher-roster`,
      {
        url,
        teachers: data.teachers,
        schoolId: data.schoolId,
      },
      {
        headers: {
          token,
        },
      },
    );
    return { success: true };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};


export const studentRoster = async (data: any) => {
  try {
    const url = `${window.location.origin}/verifyemail`;
    const token = getToken();
    await axios.post(
      `${API_URL}/schoolAdmin/student-roster`,
      {
        url,
        students: data.students,
        schoolId: data.schoolId,
      },
      {
        headers: {
          token,
        },
      },
    );
    return { success: true };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const sendSupportEmail = async (data: any) => {
  try {
    const token = getToken();
    await axios.post(`${API_URL}/auth/support-request`, data, {
      headers: {
        token,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const changePassword = async (data: any) => {
  try {
    const token = getToken();
    await axios.post(`${API_URL}/auth/changePassword`, data, {
      headers: {
        token,
      },
    });
    return { success: true };
  } catch (err: any) {
    return {
      error: {
        message: err.data.message,
      },
    };
  }
};


export async function completeTeacherRegistration({ token, name, password, subject, termsAccepted, termsVersion }: { token: string, name: string, password: string, subject: string, termsAccepted?: boolean, termsVersion?: string }) {
  try {
    const response = await axios.post(`${API_URL}/teacher/complete-registration`, {
      token,
      name,
      password,
      subject,
      termsAccepted,
      termsVersion
    });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || "Failed to complete registration";
    return { error: message };
  }
}

export async function completeGuardianRegistration({ token, name, password, email, termsAccepted, termsVersion }: { token: string, name: string, password: string, email: string, termsAccepted?: boolean, termsVersion?: string }) {
  try {
    const response = await axios.post(`${API_URL}/auth/guardian-complete-registration`, {
      token,
      name,
      password,
      email,
      termsAccepted,
      termsVersion
    });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || "Failed to complete registration";
    return { error: message };
  }
}

export const getCurrentTerms = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/get-terms`);
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
}

export const verifyCurrentUserPassword = async (password: string) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/auth/verify-password`,
      { password },
      {
        headers: {
          token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const subscribeToWaitlist = async (email: string, confirmEmail: string) => {
  try {
    const response = await axios.post(`${API_URL}/waitlist`, {
      email,
      confirmEmail,
    });
    return response.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || "Something went wrong";
    return { error: message };
  }
};

// System Admin APIs
export const getSystemDashboardStats = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/system-admin/dashboard`, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getDistricts = async (token: string, params?: any) => {
  try {
    const filteredParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    ) : {};
    const query = new URLSearchParams(filteredParams as any).toString();
    const url = `${API_URL}/districts${query ? `?${query}` : ''}`;
    const response = await axios.get(url, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const createDistrict = async (data: any, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/districts`, data, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getDistrictById = async (id: string, token: string) => {
  try {
    const response = await axios.get(`${API_URL}/districts/${id}`, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const updateDistrict = async (id: string, data: any, token: string) => {
  try {
    const response = await axios.put(`${API_URL}/districts/${id}`, data, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const deleteDistrict = async (id: string, token: string) => {
  try {
    const response = await axios.delete(`${API_URL}/districts/${id}`, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const assignDistrictAdmin = async (id: string, data: any, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/districts/${id}/admins`, data, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const bulkImportSchools = async (file: File, token: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/system-admin/import/schools`, formData, {
      headers: { 
        token
      },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getStateAnalytics = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/system-admin/analytics/states`, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const getDistrictAnalytics = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/system-admin/analytics/districts`, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const cloneFromTemplate = async (data: { templateDistrictId: string; newDistrictData: any }, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/system-admin/clone-district`, data, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const updateTerms = async (data: any, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/system-admin/terms`, data, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const inviteAdmin = async (data: { 
  email: string; 
  name: string; 
  role: string; 
  schoolId?: string; 
  districtId?: string;
  address?: string;
  phone?: string;
  position?: string;
  contactRole?: string;
}) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/system-admin/invite`, data, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
export const completeAdminRegistration = async (data: { token: string; email: string; password: string; name?: string; termsAccepted?: boolean; termsVersion?: string }) => {
  try {
    const response = await axios.post(`${API_URL}/system-admin/complete-registration`, data);
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const updateAdmin = async (id: string, data: any) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_URL}/system-admin/admins/${id}`, data, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};

export const reInviteAdmin = async (id: string) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/system-admin/admins/${id}/reinvite`, {}, {
      headers: { token },
    });
    return response.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error?.message || "Operation failed" };
  }
};
