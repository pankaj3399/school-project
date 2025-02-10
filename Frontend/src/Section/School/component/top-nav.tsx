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

export function TopNav() {
  const {user} = useAuth();


  return (
    <header className="bg-[#654f6f] text-white shadow-sm">
      <div className="flex items-center justify-end h-16 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative mr-8 h-8 w-fit rounded-full">
              {user?.name} | {user?.role === 'SchoolAdmin' ? 'Token Manager' : user?.type == 'Special' ? `Teacher | ${user?.subject}`:`${"Lead Teacher | Grade " + user?.grade}`}
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
            <DropdownMenuItem>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}