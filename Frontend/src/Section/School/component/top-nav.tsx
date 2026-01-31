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
              {user?.role === 'Admin' ? 'Super Admin' : `${user?.name} | ${user?.role === 'SchoolAdmin' ? 'System Manager' : user?.type == 'Special' ? `Teacher | ${user?.subject}` : `Lead Teacher${user?.grade ? " | Grade " + user?.grade : ""}`}`}
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