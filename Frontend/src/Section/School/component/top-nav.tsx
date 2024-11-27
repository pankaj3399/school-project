import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser } from "@/api"

export function TopNav() {
  const [admin, setAdmin] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  })

  useEffect(() => {
    const token = localStorage.getItem('token') // Replace with actual token retrieval logic
    const fetchUser = async () => {
      if (token) {
        const userData = await getCurrentUser(token)
        if (userData && userData.user.name) {
          setAdmin({ name: userData.user.name, email: userData.user.email })
        }
      }
    }

    fetchUser()
  }, [])

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-end h-16 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              {admin.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{admin.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {admin.email}
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
