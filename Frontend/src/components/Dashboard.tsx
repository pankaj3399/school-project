import { Button } from './ui/button'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
    const navigate = useNavigate()
    const logout = () => {
        localStorage.removeItem('token')
        navigate('/signin')
    }
  return (
    <div>
        <h1>Under Progress</h1>
        <Button variant={"destructive"} onClick={logout}>
           <LogOut /> SignOut
        </Button>
    </div>
  )
}

export default Dashboard