import RootLayout from "./layout";
import LandingPage from "./Section/LandingPage";
import { SignupForm } from "./components/SignupPage";
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
import SuperAdminDashboard from "./Section/School/super-admin-dashboard";
import ForgotPassword from "./components/ForgetPassword";
import OtpVerificationPage from "./components/OtpVerification";
import { ResetPassword } from "./components/ResetPassword";
import FormPageAdmin from "./Section/School/submit-form";
import DetailedHistory from "./Section/School/detailed-history";
import ViewFormsTeacher from "./Section/Teacher/view-forms";
import FormBuilderTeacher from "./Section/Teacher/form-builder";
import EditFormTeacher from "./Section/Teacher/edit-form";
import AddStudentTeacher from "./Section/Teacher/add-student";
import Analytics from "./Section/Teacher/analytics";
import Finalize from "./Section/School/finalize";
import VerifyEmail from "./components/VerifyEmail";
import SetupPage from "./Section/School/setup-page";
import Setup from "./Section/School/setup";
import SetupStudents from "./Section/School/setup-students";
import CompleteTeacherRegistration from "@/Section/Teacher/complete-registration";
import CompleteGuardianRegistration from "@/Section/Guardian/complete-registration";
import CompleteAdminRegistration from "@/Section/SystemAdmin/complete-registration";
import TermsPage from "@/components/TermsPage";
import { Role } from "./enum";

// System Admin Components
import SystemAdminDashboard from "@/Section/SystemAdmin/dashboard";
import DistrictsList from "@/Section/SystemAdmin/districts";
import AddDistrict from "@/Section/SystemAdmin/districts/add-district";
import ViewDistrict from "@/Section/SystemAdmin/districts/view-district";
import BulkImportSchools from "@/Section/SystemAdmin/schools/bulk-import";
import ViewSchool from "@/Section/SystemAdmin/schools/view-school";
import TermsManagement from "./Section/SystemAdmin/terms";
import SchoolsList from "./Section/SystemAdmin/schools/index";

const systemAdminRoles = [Role.SystemAdmin];

// Reusable ProtectedRoute component
const ProtectedRoute = ({ children, requiredRoles }: { children: React.ReactNode, requiredRoles?: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Redirect logged-in users to their respective dashboards
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === Role.Student) {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to="/analytics" replace />;
  }
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === Role.Student) {
    return <Navigate to="/student" replace />;
  }
  return <Navigate to="/analytics" replace />;
};

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <RootLayout>
        <Routes>
          <Route path="/" element={
            <AuthRedirect>
              <LandingPage />
            </AuthRedirect>
          } />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/signin" element={<LoginForm />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/verify" element={<OtpVerificationPage />} />
          <Route path="/resetpassword" element={<ResetPassword />} />

          {/* Authenticated Routes */}
          <Route path="/analytics" element={<ProtectedRoute requiredRoles={[Role.SystemAdmin, Role.Admin, Role.SchoolAdmin, Role.Teacher]}><Analytics /></ProtectedRoute>} />
          <Route path="/addteacher" element={<ProtectedRoute><AddTeacher /></ProtectedRoute>} />
          <Route path="/addstudent" element={<ProtectedRoute><AddStudent /></ProtectedRoute>} />
          <Route path="/print-report" element={<ProtectedRoute><Finalize /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
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
          <Route path="/teachers/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/teachers/print-report" element={<ProtectedRoute><Finalize /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><ViewPointHistory /></ProtectedRoute>} />

          {/* Dashboards */}
          <Route path="/home" element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          } />
          <Route path="/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><ViewTeachers /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute><Students /></ProtectedRoute>} />

          <Route path="/school/points-history" element={<ProtectedRoute><DetailedHistory /></ProtectedRoute>} />
          <Route path="/teachers/points-history" element={<ProtectedRoute><DetailedHistory /></ProtectedRoute>} />

          <Route path="/verifyemail" element={<VerifyEmail />} />
          <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
          <Route path="/setup-teachers" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="/setup-students" element={<ProtectedRoute><SetupStudents /></ProtectedRoute>} />
          <Route path="/teachers/students-setup" element={<ProtectedRoute><SetupStudents /></ProtectedRoute>} />
          <Route path="/teacher/complete-registration" element={<CompleteTeacherRegistration />} />
          <Route path="/guardian/complete-registration" element={<CompleteGuardianRegistration />} />
          <Route path="/admin/complete-registration" element={<CompleteAdminRegistration />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* System Admin Routes */}
          <Route path="/admin" element={<Navigate to="/system-admin" replace />} />
          <Route path="/system-admin" element={<ProtectedRoute requiredRoles={systemAdminRoles}><SystemAdminDashboard /></ProtectedRoute>} />
          <Route path="/system-admin/schools/import" element={<ProtectedRoute requiredRoles={systemAdminRoles}><BulkImportSchools /></ProtectedRoute>} />
          <Route path="/system-admin/districts" element={<ProtectedRoute requiredRoles={systemAdminRoles}><DistrictsList /></ProtectedRoute>} />
          <Route path="/system-admin/districts/new" element={<ProtectedRoute requiredRoles={systemAdminRoles}><AddDistrict /></ProtectedRoute>} />
          <Route path="/system-admin/districts/:id" element={<ProtectedRoute requiredRoles={systemAdminRoles}><ViewDistrict /></ProtectedRoute>} />
          <Route path="/system-admin/schools" element={<ProtectedRoute requiredRoles={systemAdminRoles}><SchoolsList /></ProtectedRoute>} />
          <Route path="/system-admin/schools/new" element={<ProtectedRoute requiredRoles={systemAdminRoles}><AddSchool /></ProtectedRoute>} />
          <Route path="/system-admin/schools/:id" element={<ProtectedRoute requiredRoles={systemAdminRoles}><ViewSchool /></ProtectedRoute>} />
          <Route path="/system-admin/terms" element={<ProtectedRoute requiredRoles={systemAdminRoles}><TermsManagement /></ProtectedRoute>} />

          <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RootLayout>
    </div>
  );
}