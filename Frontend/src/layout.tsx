// import { useToast } from "@/hooks/use-toast";
import { SideNav } from "@/Section/School/component/side-nav";
import { TeacherSideNav } from "@/Section/Teacher/component/side-nav";
import { TopNav } from "@/Section/School/component/top-nav";
import { Breadcrumb } from "@/Section/School/component/breadcrumb";
import Footer from "@/components/Footer";
import { useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./authContext";
import { OtpProvider } from "./components/OtpContextProvider";
// import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation(); // Get the current path
  const pathname = location.pathname;


  // Define routes for the simple layout
  const simpleLayoutRoutes = ['/', '/signup', '/signin','/forgotpassword', '/verify','/resetpassword', '/verifyemail', '/teacher/complete-registration'];

  const isSimpleLayout = simpleLayoutRoutes.includes(pathname);
  const isTeacherLayout = pathname.startsWith('/teachers');
  if (isSimpleLayout) {
    return (
      <AuthProvider>
        <OtpProvider>
      <div>
        <Toaster />
        {children}
      </div>
        </OtpProvider>
      </AuthProvider>
    );
  }
  if (isTeacherLayout) {
    return (
      <AuthProvider>
      <div className="flex min-h-screen bg-gray-100">
      <TeacherSideNav />
      <Toaster />
      <div className="flex flex-col flex-1">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#ffffff]">
          <div className="container mx-auto px-6 py-8">
            <Breadcrumb />
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
    </AuthProvider>
    );
  }

  return (
    <AuthProvider>
    <div className="flex min-h-screen bg-gray-200 ">
      <SideNav />
      <Toaster />
      <div className="flex flex-col flex-1">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto  border bg-[#ffffff]   ">
          <div className="container mx-auto px-3 py-8">
            {pathname !== '/analytics' && <Breadcrumb />}
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
    </AuthProvider>
    );
}