//f
import axios from "axios";
import { AnswerType, AnswerTypeArray } from "@/lib/types";

const API_URL= import.meta.env.VITE_API_URL
console.log(API_URL);


const getToken = () => localStorage.getItem('token')

export const signUp = async (data:{
    email: string,
    password: string,
    role: string,
    name: string
}) => {
    try {
        const response = await axios.post(`${API_URL}/auth/signup`, data);
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const signIn = async (data:{
    email: string,
    password: string,
}) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, data);
        return response.data;
        
    } catch (error) {
        return {error};
    }
}
export const addStudent = async (data:{
    email: string,
    password: string,
    standard: string,
    name: string,
    sendNotifications: boolean,
    parentEmail: string
}, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/student/addStudent`, data, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const updateStudent = async (data:Partial<{
    email: string,
    password: string,
    standard: string,
    name: string,
    parentEmail: string
}>,id:string, token: string) => {
    try {
        const response = await axios.put(`${API_URL}/student/updateStudent/${id}`, data, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const deleteStudent = async (id:string, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/student/deleteStudent/${id}`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const addSchool = async (data:FormData, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/schoolAdmin/addSchool`, data,{
            headers:{
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const addTeacher = async (data:{
    email: string,
    password: string,
    name: string,
    subject: string,
    recieveMails: boolean
}, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/teacher/addTeacher`, data, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const updateTeacher = async (data:Partial<{
    email: string,
    password: string,
    name: string,
    subject: string,
    recieveMails: boolean
}> , id:string, token: string) => {
    try {
        const response = await axios.put(`${API_URL}/teacher/updateTeacher/${id}`, data, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const deleteTeacher = async (id:string, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/teacher/deleteTeacher/${id}`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getAllSchools = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}/school/`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const getStudents = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}/school/students`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}



export const getCurrrentSchool = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}/school/school`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getCurrentUser = async (token ?: string) => {
    token?.split("")
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/user`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const updateSchool = async (data:FormData, id:string, token: string) => {
    try {
        const response = await axios.put(`${API_URL}/school/updateSchool/${id}`, data,{
            headers:{
                token
            }
        });
        return response;
    } catch (error) {
        return {error};
    }
}

export const getForms = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}/form/getForms`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const createForm = async (data:any, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/schoolAdmin/createForm`, data, {
            headers: {token}
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const editForm = async (id:string,data:any, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/schoolAdmin/editForm/${id}`, data, {
            headers: {token}
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const deleteForm = async (id:string, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/schoolAdmin/deleteForm/${id}`, {
            headers: {token}
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getFormById = async (id:string, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/form/getFormById/${id}`,{
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const submitFormTeacher = async (data:AnswerType, submittedFor:string, isSendEmail:{
    studentEmail: boolean;
    teacherEmail: boolean;
    schoolAdminEmail: boolean;
    parentEmail: boolean;
} , formId:string, token: string, submittedAt: Date) => {
    try {
        const answers:AnswerTypeArray = Object.entries(data).map(([questionId, answer]) => ({
            questionId,
            answer: answer.answer,
            points: answer.points
        }))
        const response = await axios.post(`${API_URL}/form/submitFormTeacher/${formId}`, {
            answers,
            submittedFor,
            submittedAt,
            ...isSendEmail
        }, {headers: {
            token
        }});
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const submitFormAdmin = async (data:AnswerType, submittedFor:string, isSendEmail:{
    studentEmail: boolean;
    teacherEmail: boolean;
    schoolAdminEmail: boolean;
    parentEmail: boolean;
} , formId:string, submittedAt:Date) => {
    try {
        const token = getToken()
        const answers:AnswerTypeArray = Object.entries(data).map(([questionId, answer]) => ({
            questionId,
            answer: answer.answer,
            points: answer.points
        }))
        const response = await axios.post(`${API_URL}/form/submitFormAdmin/${formId}`, {
            answers,
            submittedFor,
            ...isSendEmail,
            submittedAt
        }, {headers: {
            token
        }});
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getPointHistory = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}/form/getPointHistory`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getStats = async () => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/schoolAdmin/stats`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const getMonthlyStats = async () => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/schoolAdmin/stats/monthly`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const getPointsGivenPerMonth = async () => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/schoolAdmin/stats/pointsgiven`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const getPointsGivenPerMonthPerTeacher = async (id:string) => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/schoolAdmin/stats/pointsgiven/${id}`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getPointsReceivedPerMonth = async (id:string) => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/schoolAdmin/stats/pointsreceived/${id}`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const getFormsSubmittedPerMonth = async () => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/schoolAdmin/stats/formsubmitted`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getFormsSubmittedPerMonthPerTeacher = async (id:string) => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/schoolAdmin/stats/formsubmitted/${id}`, {headers: {token}});
        return response.data;
    } catch (error) {
        return {error};
    }
}


export const getTeachers = async () => {
    try {
        const token = getToken()
        const response = await axios.get(`${API_URL}/school/teachers`, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const sendOtp = async ({email, role}:{
    email: string,
    role: string
}) => {
    try {
        const response = await axios.post(`${API_URL}/auth/sendotp`,{
            email,
            role
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const verifyOtp = async ({otp, email, role}:{
    email:string,
    role:string,
    otp: string
}) => {
    try {
        const response = await axios.post(`${API_URL}/auth/verify`,{
            otp, email, role
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const resetPassword = async (data: any) => {
    try {
        const response = await axios.post(`${API_URL}/auth/resetpassword`,{
            ...data
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getHistoryOfYear = async () => {
    try {
        const token = getToken()
        const response = await axios.post(`${API_URL}/school/getYearPointsHistory`,{}, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getHistoryOfYearByStudent = async (id:string) => {
    try {
        const token = getToken()
        const response = await axios.post(`${API_URL}/school/getYearPointsHistory/${id}`,{}, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getReportDataStudent = async (id:string, grade:string) => {
    try {
        const token = getToken()
        const response = await axios.post(`${API_URL}/schoolAdmin/stats/reportdata/${id}`,{
            grade
        }, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getHistoryOfCurrentWeek = async (data: any) => {
    try {
        const token = getToken()
        const response = await axios.post(`${API_URL}/school/getCurrentWeekPoints`,data, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getHistoryOfCurrentWeekByStudent = async (id:string,data: any) => {
    try {
        const token = getToken()
        const response = await axios.post(`${API_URL}/school/getCurrentWeekPoints/${id}`,data, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}
export const getHistoryByTime = async (data: any) => {
    try {
        const token = getToken()
        const response = await axios.post(`${API_URL}/school/getHistoryByTime`,data, {
            headers: {
                token
            }
        });
        return response.data;
    } catch (error) {
        return {error};
    }
}

export const getRanks = async () => {
    try {
        const token = getToken()
        const response1 = await axios.post(`${API_URL}/school/getTeacherPoints`,{}, {
            headers: {
                token
            }
        });
        const response2 = await axios.post(`${API_URL}/school/getStudentPoints`,{}, {
            headers: {
                token
            }
        });
        return {teachers: response1.data, students: response2.data};
    } catch (error) {
        return {error};
    }
}

export const promote = async () => {
    try {
        const token = getToken()
        await axios.put(`${API_URL}/school/promote`,{}, {
            headers: {
                token
            }
        });
        return {success:true};
    } catch (error) {
        return {error};
    }
}

export const sendReport = async (data: FormData, email: string) => {
    try {
        const token = getToken();
        const response = await axios.post(`${API_URL}/schoolAdmin/sendReport/${email}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                token: token || ""
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { error };
    }
};

export const resetStudentRoster = async () => {
    try {
        const token = getToken()
        await axios.put(`${API_URL}/schoolAdmin/resetStudentRoster`,{}, {
            headers: {
                token
            }
        });
        return {success:true};
    } catch (error) {
        return {error};
    }
}