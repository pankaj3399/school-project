import RootLayout from "./layout"
import LandingPage from "./Section/LandingPage"
import SignupForm from "./components/SignupPage"
import { Navigate, Route, Routes } from "react-router-dom"
import LoginForm from "./components/SigninPage"

import AddSchool from "./Section/School/add-school"
import AddTeacher from "./Section/School/add-teacher"
import AddStudent from "./Section/School/add-student"
import ViewSchools from "./Section/School/view-schools"
import ViewStudents from "./Section/School/view-student"
import ViewTeachers from "./Section/School/view-teachers"

const isAuthorized = () => {
  const token = localStorage.getItem("token")
  if (token) {
    return true
  }
  return false
}
export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <RootLayout >
        <Routes>
        <Route path="/" element = {<LandingPage />} />
          <Route path="/signup" element={<SignupForm/>} />
          <Route path="/signin" element={<LoginForm />} />
          
          <Route path="/addschool" element={isAuthorized() ?  <AddSchool/>:<Navigate to='/'/>  } />
          <Route path="/addteacher" element={isAuthorized() ? <AddTeacher/>:<Navigate to='/'/> } />
          <Route path="/addstudent" element={isAuthorized() ? <AddStudent/>:<Navigate to='/'/> } />
          <Route path="viewschool" element={isAuthorized() ? <ViewSchools/>:<Navigate to='/'/> } />
          <Route path="/viewteacher" element={isAuthorized() ? <ViewTeachers/>:<Navigate to='/'/> } />
          <Route path="/view" element={isAuthorized() ? <ViewStudents/>:<Navigate to='/'/> } />
      </Routes>
      </RootLayout>
    </div>
  )
}