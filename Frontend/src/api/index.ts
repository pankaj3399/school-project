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
        const response = await axios.post(`${API_URL}/schoolAdmin/addStudent`, data, {
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
    subject: string
}, token: string) => {
    try {
        const response = await axios.post(`${API_URL}/schoolAdmin/addTeacher`, data, {
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