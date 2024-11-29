import axios from "axios";


const API_URL= import.meta.env.VITE_API_URL
console.log(API_URL);

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

export const addSchool = async (data:{
    address: string,
    logo: string,
    name: string
}, token: string) => {
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
export const getTeachers = async (token: string) => {
    try {
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

export const getCurrentUser = async (token: string) => {
    try {
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