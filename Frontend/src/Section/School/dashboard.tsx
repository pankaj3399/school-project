//School/dashboard.tsx
import ByStudentStats from './component/ByStudentStats'
import ByTeacherStats from './component/ByTeacherStats'
import OverallStats from './component/OverallStats'

const AdminDashboard = () => {
    
  return (
    <div className='space-y-4'>
      <OverallStats />
      <ByTeacherStats />
      <ByStudentStats />
    </div>
  )
}

export default AdminDashboard
