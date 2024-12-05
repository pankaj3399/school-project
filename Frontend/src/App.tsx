import RootLayout from "./layout";
import LandingPage from "./Section/LandingPage";
import {SignupForm} from "./components/SignupPage";
import LoginForm from "./components/SigninPage";
import AddSchool from "./Section/School/add-school";
import AddTeacher from "./Section/School/add-teacher";
import AddStudent from "./Section/School/add-student";
import ViewStudents from "./Section/School/view-student";
import ViewTeachers from "./Section/School/view-teachers";
import Students from "./Section/Students/Students";
import Teachers from "./Section/Teacher/Teacher";
import FormBuilder from "./Section/School/form-builder";
import ViewTeacherStudents from "./Section/Teacher/view-students";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./authContext";

// Reusable ProtectedRoute component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); 
  return user ? <>{children}</> : <Navigate to="/" />;
};

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <RootLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/signin" element={<LoginForm />} />

          {/* Protected Routes */}
          <Route path="/addschool" element={<ProtectedRoute><AddSchool /></ProtectedRoute>} />
          <Route path="/addteacher" element={<ProtectedRoute><AddTeacher /></ProtectedRoute>} />
          <Route path="/addstudent" element={<ProtectedRoute><AddStudent /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
          <Route path="/viewteacher" element={<ProtectedRoute><ViewTeachers /></ProtectedRoute>} />
          <Route path="/viewstudent" element={<ProtectedRoute><ViewStudents /></ProtectedRoute>} />
          <Route path="/teachers/viewstudent" element={<ProtectedRoute><ViewTeacherStudents /></ProtectedRoute>} />
          <Route path="/createform" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />

          {/* Uncomment when ready */}
          {/* <Route path="/viewforms" element={<ProtectedRoute><ViewForms /></ProtectedRoute>} /> */}
          {/* <Route path="/teachers/viewforms" element={<ProtectedRoute><ViewTeacherForms /></ProtectedRoute>} /> */}
          {/* <Route path="/teachers/submitform/:id" element={<ProtectedRoute><FormPage /></ProtectedRoute>} /> */}
          {/* <Route path="/teachers/pointhistory" element={<ProtectedRoute><PointHistory /></ProtectedRoute>} /> */}
          {/* <Route path="/pointhistory" element={<ProtectedRoute><PointHistory /></ProtectedRoute>} /> */}
        </Routes>
      </RootLayout>
    </div>
  );
}