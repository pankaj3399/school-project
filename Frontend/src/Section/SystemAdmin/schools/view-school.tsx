import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getCurrrentSchool, getStats } from '@/api'
import CurrentWeekCharts from '../../School/component/current-week-charts'
import EducationYearChart from '../../School/component/new-chart'
import TeacherRanks from '../../School/component/TeacherRanks'
import { Card, CardContent } from "@/components/ui/card"
import { IconUsers, IconUserStar, IconCoins, IconArrowBackUp, IconMessage2, IconAlertCircle } from '@tabler/icons-react'

const ViewSchool = () => {
  const { id } = useParams<{ id: string }>()
  const [school, setSchool] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<Error | null>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    const requestId = ++requestRef.current
    try {
      setLoading(true)
      setSchool(null)
      setStats(null)
      setFetchError(null)
      const token = localStorage.getItem('token') || ''
      const [schoolRes, statsRes] = await Promise.all([
        getCurrrentSchool(token, id),
        getStats(id)
      ])

      if (requestId !== requestRef.current) return

      if (schoolRes.school) {
        setSchool(schoolRes.school)
      } else {
        // Specific case where 200 OK but school is somehow missing from response
        setSchool(null)
      }
      setStats(statsRes)
    } catch (error: any) {
      if (requestId !== requestRef.current) return
      console.error('Error fetching school data:', error)
      
      // Axios error handling: 404 is "confirmed not found", others are generic errors
      if (error.response?.status === 404) {
        setSchool(null)
      } else {
        setFetchError(error)
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-neutral-500">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
        Loading school data...
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
        <IconAlertCircle className="w-12 h-12 text-red-500" />
        <div>
          <h2 className="text-xl font-semibold text-neutral-800">Connection Error</h2>
          <p className="text-neutral-500 max-w-md">
            Failed to fetch school data. Please check your connection and try again.
            <br />
            <span className="text-sm">({fetchError.message})</span>
          </p>
        </div>
        <button 
          onClick={() => fetchData()}
          className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-2 text-center text-neutral-500">
        <IconAlertCircle className="w-12 h-12 text-neutral-300" />
        <p className="text-xl font-medium">School not found</p>
        <p>The school you are looking for does not exist or has been removed.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {school.logo && (
            <img 
              src={school.logo} 
              alt={school.name} 
              className="w-16 h-16 rounded-lg object-contain bg-white border border-neutral-200 p-1"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{school.name}</h1>
            <p className="text-neutral-500">{school.address}, {school.district?.name || 'Unassigned District'}</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          title="Total Students" 
          value={stats?.totalStudents || 0} 
          icon={<IconUsers className="w-6 h-6" />}
          color="blue"
        />
        <StatCard 
          title="Total Teachers" 
          value={stats?.totalTeachers || 0} 
          icon={<IconUserStar className="w-6 h-6" />}
          color="green"
        />
        <StatCard 
          title="Total Points" 
          value={stats?.totalPoints || 0} 
          icon={<IconCoins className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard 
          title="Withdrawn" 
          value={stats?.totalWithdrawPoints || 0} 
          icon={<IconArrowBackUp className="w-6 h-6" />}
          color="red"
        />
        <StatCard 
          title="Deducted" 
          value={stats?.totalDeductPoints || 0} 
          icon={<IconAlertCircle className="w-6 h-6" />}
          color="orange"
        />
        <StatCard 
          title="Feedback" 
          value={stats?.totalFeedbackCount || 0} 
          icon={<IconMessage2 className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-3 space-y-6'>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
             <EducationYearChart studentId='' schoolId={id} />
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-4">
             <CurrentWeekCharts studentId='' schoolId={id} />
          </div>
        </div>
        <div className="space-y-6">
           <TeacherRanks studentId='' schoolId={id} />
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  }

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className={`p-2 rounded-lg mb-2 ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="text-2xl font-bold text-neutral-800">{value.toLocaleString()}</div>
        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{title}</div>
      </CardContent>
    </Card>
  )
}

export default ViewSchool
