import { getFormsSubmittedPerMonthPerTeacher, getPointsGivenPerMonthPerTeacher, getTeachers } from '@/api'
import { useEffect, useState } from 'react'
import LineChartCard from './line-chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BarChartCard from './bar-chart'

const ByTeacherStats = () => {
    const [pointsGivenPerMonth, setPointsGivenPerMonth] = useState<number[]>([])
    const [formSubmissions, setFormSubmissions] = useState<number[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [teacherId, setTeacherId] = useState<string>("")

    useEffect(()=>{
        const fetchData = async () => {
            const resTeacher = await getTeachers()
            setTeachers(resTeacher.teachers)
        }
        fetchData()
    },[])

    useEffect(()=>{
      const fetchData = async () => {
            if(!teacherId) return;

            const resPoints = await getPointsGivenPerMonthPerTeacher(teacherId)
            setPointsGivenPerMonth(resPoints.monthlyPoints);
            const resForms = await getFormsSubmittedPerMonthPerTeacher(teacherId)
            setFormSubmissions(resForms.monthlyForms)
      }
      fetchData()
    },[teacherId])


  return (
    <div className='grid grid-cols-2 gap-4 mt-2 '>
        <h4 className='col-span-2 text-3xl font-bold'>Stats By Teacher</h4>
        <div className='col-span-2'>
            <Select value={teacherId} onValueChange={(value) => setTeacherId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers && teachers.map((teacher: any) => (
                  <SelectItem key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        <BarChartCard label={"Total Points Given"} data={pointsGivenPerMonth} />
        <BarChartCard label={"Total Forms submitted"} data={formSubmissions} />
    </div>
  )
}

export default ByTeacherStats