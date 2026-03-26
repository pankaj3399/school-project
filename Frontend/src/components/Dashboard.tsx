import { Button } from './ui/button'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../authContext'

const Dashboard = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const handleLogout = () => {
        logout()
        navigate('/signin')
    }
  return (
    <div>
        <h1>Under Progress</h1>
        <Button variant={"destructive"} onClick={handleLogout}>
           <LogOut /> SignOut
        </Button>
    </div>
  )
}

export default Dashboard