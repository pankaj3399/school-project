//School/component/
import { getPointsReceivedPerMonth, getStudents } from '@/api'
import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BarChartCard from './bar-chart'
import { useSchoolSelectionGuard } from '@/hooks/useSchoolSelectionGuard'

const ByStudentStats = () => {
    const { isMultiSchoolUser, requiresSchoolSelection, selectedSchoolId } = useSchoolSelectionGuard()
    const [pointReceivedPerMonth, setpointReceivedPerMonth] = useState<number[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [studentId, setStudentId] = useState<string>("")
    const [studentName, setStudentName] = useState<string>("")

    useEffect(()=>{
        const fetchData = async () => {
            if (requiresSchoolSelection) {
                setStudents([])
                setStudentId("")
                setStudentName("")
                return
            }
            const token = localStorage.getItem('token')
            const effectiveSchoolId = isMultiSchoolUser
                ? (selectedSchoolId || undefined)
                : undefined
            const resTeacher = await getStudents(token ?? "", effectiveSchoolId)
            setStudents(resTeacher.students || [])
        }
        fetchData()
    },[selectedSchoolId, isMultiSchoolUser, requiresSchoolSelection])

    useEffect(()=>{
      const fetchData = async () => {
            if(!studentId) return;

            const resPoints = await getPointsReceivedPerMonth(studentId)
            setpointReceivedPerMonth(resPoints.monthlyPoints);
            
      }
      fetchData()
    },[studentId])


  return (
    <div className='grid grid-cols-2 gap-4 mt-2 '>
        <h4 className='col-span-2 text-3xl font-bold'>Stats By Student</h4>
        <div className='col-span-2'>
            <Select value={studentId} onValueChange={(value) => {
                setStudentId(value)
                setStudentName(students.filter(student => value === student._id)[0].name)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Student" />
              </SelectTrigger>
              <SelectContent>
                {students && students.map((teacher: any) => (
                  <SelectItem key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        {studentId && (
            <BarChartCard title={`Points Received by ${studentName}`} data={pointReceivedPerMonth} color='#4CAF50' />
        )}
    </div>
  )
}

export default ByStudentStats
