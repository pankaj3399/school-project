// import { useToast } from "@/hooks/use-toast";
import { SideNav } from "@/Section/School/component/side-nav";
import { TopNav } from "@/Section/School/component/top-nav";
import { Breadcrumb } from "@/Section/School/component/breadcrumb";
import { useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
// import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation(); // Get the current path
  const pathname = location.pathname;


  // Define routes for the simple layout
  const simpleLayoutRoutes = ['/', '/signup', '/signin','/students','/teachers'];

  const isSimpleLayout = simpleLayoutRoutes.includes(pathname);

  if (isSimpleLayout) {
    // Render the simple layout for '/' '/signup' '/signin'
    return (
      <div>
        <Toaster />
        {children}
      </div>
    );
  }

  // Render the dashboard layout for other routes
  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
