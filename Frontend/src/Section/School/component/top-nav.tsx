import { Button } from "@/components/ui/button"
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
import { useNavigate } from 'react-router-dom';

export function TopNav() {
  const { user } = useAuth();
  const [showSupport, setShowSupport] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove token from localStorage and sessionStorage
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  const getUserLabel = () => {
    if (!user) return "";
    if (user.role === 'Admin') return 'Super Admin';

    let label = user.name || "";
    if (user.role === 'SchoolAdmin') {
      label += ' | System Manager';
    } else if (user.type === 'Special') {
      label += ` | Teacher | ${user.subject || 'N/A'}`;
    } else {
      label += ' | Lead Teacher';
      if (user.grade) {
        label += ` | Grade ${user.grade}`;
      }
    }
    return label;
  };

  return (
    <header className="bg-[#654f6f] text-white shadow-sm">
      <div className="flex items-center justify-end h-16 px-4 space-x-4">
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
              className={`relative mr-8 h-8 w-fit rounded-full ${user?.role === 'Admin' ? 'bg-white text-[#654f6f] hover:bg-white/90 hover:text-[#654f6f]' : 'text-white hover:text-white hover:bg-[#7a617f]'}`}
            >
              {getUserLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col  space-y-1">
                <p className="text-sm font-medium  leading-none ">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground ">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}