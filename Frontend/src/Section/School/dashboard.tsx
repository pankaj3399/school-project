//School/dashboard.tsx
import CurrentWeekCharts from './component/current-week-charts'
import EducationYearChart from './component/new-chart'
import Ranks from './component/ranks'

const AdminDashboard = () => {
    
  return (
    <div className='space-y-4 grid grid-cols-4'>
      <div className='col-span-3'>
        <EducationYearChart studentId='' />
        <CurrentWeekCharts studentId='' />
      </div>
      <Ranks/>
    </div>
  )
}

export default AdminDashboard
