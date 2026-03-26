import { Button } from "@/components/ui/button"
import { School, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/authContext"
import SupportPanel from "../support-panel"
import { useState } from "react"
import { useNavigate, useLocation } from 'react-router-dom';
import { SchoolSelector } from "@/components/SchoolSelector";
import { Role } from "@/enum";

export function TopNav() {
  const { user, logout } = useAuth();
  const [showSupport, setShowSupport] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserLabel = () => {
    if (!user) return "";
    switch (user.role) {
      case Role.SystemAdmin: return "System Admin";
      case Role.Admin: return "District Manager";
      case Role.SchoolAdmin: return "School Admin";
      case Role.Teacher: return "Teacher";
      case Role.Student: return "Student";
      default: return user.role;
    }
  };

  // Only show school selector for System Admin on specific reporting/roster pages
  const allowedPaths = [
    '/analytics', 
    '/teacher', // This matches both /teacher and /teachers roster pages
    '/students', 
    '/history', 
    '/print-report', 
    '/viewforms', 
    '/createform', 
    '/editform', 
    '/addteacher', 
    '/addstudent',
    '/school/points-history',
    '/setup',
    '/setup-teachers',
    '/setup-students'
  ];
  
  const isSystemAdminOverview = location.pathname === '/system-admin';
  const showSchoolSelector = (user?.role === Role.SystemAdmin || user?.role === Role.Admin) && 
    !isSystemAdminOverview &&
    allowedPaths.some(path => location.pathname.startsWith(path));

  return (
    <header className="bg-[#654f6f] text-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <div /> {/* Spacer to push content to the right */}
        <div className="flex items-center space-x-4 pr-4">
          {showSchoolSelector ? (
            <SchoolSelector />
          ) : (
            user?.role !== Role.SystemAdmin && user?.schoolId?.name && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md border border-white/20">
                <School className="h-4 w-4 opacity-70" />
                <span className="text-sm font-medium">{typeof user.schoolId === 'object' ? user.schoolId.name : user.schoolId}</span>
              </div>
            )
          )}
          <SupportPanel
            isOpen={showSupport}
            onOpenChange={setShowSupport}
            trigger={
              <Button variant="ghost" className="text-white hover:text-white hover:bg-[#7a617f]">
                Support
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 flex items-center justify-center p-0"
              >
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {user?.role === Role.SystemAdmin ? (
                <>
                  <DropdownMenuLabel className="font-semibold px-2 py-1.5 text-[#654f6f]">
                    {getUserLabel()}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/system-admin')} className="cursor-pointer font-medium">
                    System Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <span className="text-[10px] bg-[#654f6f]/10 text-[#654f6f] px-1.5 py-0.5 rounded ml-2 font-semibold uppercase tracking-wider">
                          {getUserLabel()}
                        </span>
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}