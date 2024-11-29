import RootLayout from "./layout"
import LandingPage from "./Section/LandingPage"
import SignupForm from "./components/SignupPage"
import {  Route, Routes } from "react-router-dom"
import LoginForm from "./components/SigninPage"

import AddSchool from "./Section/School/add-school"
import AddTeacher from "./Section/School/add-teacher"
import AddStudent from "./Section/School/add-student"
import ViewSchools from "./Section/School/view-schools"
import ViewStudents from "./Section/School/view-student"
import ViewTeachers from "./Section/School/view-teachers"


export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <RootLayout >
        <Routes>
        <Route path="/" element = {<LandingPage />} />
          <Route path="/signup" element={<SignupForm/>} />
          <Route path="/signin" element={<LoginForm />} />
          
          <Route path="/addschool" element={  <AddSchool/>  } />
          <Route path="/addteacher" element={ <AddTeacher/> } />
          <Route path="/addstudent" element={ <AddStudent/> } />
          <Route path="viewschool" element={ <ViewSchools/> } />
          <Route path="/viewteacher" element={ <ViewTeachers/> } />
          <Route path="/view" element={ <ViewStudents/> } />
      </Routes>
      </RootLayout>
    </div>
  )
}