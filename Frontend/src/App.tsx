import RootLayout from "./layout"
import LandingPage from "./Section/LandingPage"
import SignupForm from "./components/SignupPage"
import {  Route, Routes } from "react-router-dom"
import LoginForm from "./components/SigninPage"

import AddSchool from "./Section/School/add-school"
import AddTeacher from "./Section/School/add-teacher"
import AddStudent from "./Section/School/add-student"
import ViewStudents from "./Section/School/view-student"
import ViewTeachers from "./Section/School/view-teachers"
import Students from "./Section/Students/Students"
import Teachers from "./Section/Teacher/Teacher"
import FormBuilder from "./Section/School/form-builder"
import ViewForms from "./Section/School/view-forms"
import ViewTeacherForms from "./Section/Teacher/view-teacher-forms"
import ViewTeacherStudents from "./Section/Teacher/view-students"
import FormPage from "./Section/Teacher/submit-form"
import PointHistory from "./Section/School/component/point-history"

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <RootLayout >
        <Routes>
        <Route path="/" element = {<LandingPage />} />
          <Route path="/signup" element={<SignupForm/>} />
          <Route path="/signin" element={<LoginForm />} />
          
          <Route path="/addschool" element={ <AddSchool/>  } />
          <Route path="/addteacher" element={<AddTeacher/> } />
          <Route path="/addstudent" element={ <AddStudent/> } />
          <Route path="/students" element={ <Students/> } />
          <Route path="/teachers" element={ <Teachers/> } />
          <Route path="/viewteacher" element={ <ViewTeachers/> } />
          <Route path="/viewstudent" element={ <ViewStudents/> } />
          <Route path="/createform" element={ <FormBuilder/> } />
          <Route path="/viewforms" element={ <ViewForms/> } />
          <Route path="/teachers/viewforms" element={ <ViewTeacherForms/> } />
          <Route path="/teachers/viewstudent" element={ <ViewTeacherStudents/> } />
          <Route path="/teachers/submitform/:id" element={<FormPage/> } />
          <Route path="/teachers/pointhistory" element={ <PointHistory/> } />
          <Route path="/pointhistory" element={<PointHistory/> } />
      </Routes>
      </RootLayout>
    </div>
  )
}