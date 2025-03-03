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
import ViewForms from "./Section/School/view-forms";
import ViewTeacherForms from "./Section/Teacher/view-teacher-forms";
import FormPage from "./Section/Teacher/submit-form";
import ViewPointHistory from "./Section/School/component/point-history";
import EditForm from "./Section/School/edit-form";
import AdminDashboard from "./Section/School/dashboard";
import ForgotPassword from "./components/ForgetPassword";
import OtpVerificationPage from "./components/OtpVerification";
import { ResetPassword } from "./components/ResetPassword";
import FormPageAdmin from "./Section/School/submit-form";
import DetailedHistory from "./Section/School/detailed-history";
import ViewFormsTeacher from "./Section/Teacher/view-forms";
import FormBuilderTeacher from "./Section/Teacher/form-builder";
import EditFormTeacher from "./Section/Teacher/edit-form";
import AddStudentTeacher from "./Section/Teacher/add-student";
import TeacherDashboard from "./Section/Teacher/analytics";
import Finalize from "./Section/School/finalize";
import VerifyEmail from "./components/VerifyEmail";


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
          
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/signin" element={<LoginForm />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/verify" element={<OtpVerificationPage />} />
          <Route path="/resetpassword" element={<ResetPassword />} />

          <Route path="/analytics" element={<ProtectedRoute><AddSchool /></ProtectedRoute>} />
          <Route path="/addteacher" element={<ProtectedRoute><AddTeacher /></ProtectedRoute>} />
          <Route path="/addstudent" element={<ProtectedRoute><AddStudent /></ProtectedRoute>} />
          <Route path="/print-report" element={<ProtectedRoute><Finalize /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><ViewTeachers /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><ViewStudents /></ProtectedRoute>} />
          <Route path="/teachers/students" element={<ProtectedRoute><ViewTeacherStudents /></ProtectedRoute>} />
          <Route path="/createform" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
          <Route path="/editform/:id" element={<ProtectedRoute><EditForm /></ProtectedRoute>} />
          <Route path="/schoolAdmin/submitform/:id" element={<ProtectedRoute><FormPageAdmin /></ProtectedRoute>} />

 
          <Route path="/viewforms" element={<ProtectedRoute><ViewForms /></ProtectedRoute>} />
          <Route path="/teachers/createform" element={<ProtectedRoute><FormBuilderTeacher /></ProtectedRoute>} />
          <Route path="/teachers/editform/:id" element={<ProtectedRoute><EditFormTeacher /></ProtectedRoute>} />
          <Route path="/teachers/viewforms" element={<ProtectedRoute><ViewFormsTeacher /></ProtectedRoute>} />
          <Route path="/teachers/managepoints" element={<ProtectedRoute><ViewTeacherForms /></ProtectedRoute>} />
          <Route path="/teachers/addstudent" element={<ProtectedRoute><AddStudentTeacher /></ProtectedRoute>} />
          <Route path="/teachers/submitform/:id" element={<ProtectedRoute><FormPage /></ProtectedRoute>} />
          <Route path="/teachers/history" element={<ProtectedRoute><ViewPointHistory /></ProtectedRoute>} />
          <Route path="/teachers/analytics" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teachers/print-report" element={<ProtectedRoute><Finalize /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><ViewPointHistory /></ProtectedRoute>} />

          {/*Dashboards*/}
          <Route path="/home" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute><Students /></ProtectedRoute>} />

          
          <Route path="/school/points-history" element={<ProtectedRoute><DetailedHistory /></ProtectedRoute>} />
          <Route path="/teachers/points-history" element={<ProtectedRoute><DetailedHistory /></ProtectedRoute>} />

          <Route path="/verifyemail" element={<VerifyEmail />}>
          </Route>

        </Routes>
      </RootLayout>
    </div>
  );
}