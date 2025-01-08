import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getPointHistory, getStudents } from "@/api"
import Loading from "../../Loading"
import { SelectContent, SelectItem, SelectTrigger, SelectValue, Select } from "@/components/ui/select"


export default function ViewPointHistoryTeacher() {
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [studentId, setStudentId] = useState<string>("")
  const [studentName, setStudentName] = useState<string>("")
  
      useEffect(()=>{
          const fetchData = async () => {
              const token = localStorage.getItem('token')
              const resTeacher = await getStudents(token ?? "")
              setStudents(resTeacher.students)
          }
          fetchData()
      },[])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          toast({
            title: "Error",
            description: "No token found.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const data = await getPointHistory(token)
        setPointHistory(data.pointHistory)
        setLoading(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch point history.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchStudents()
  }, [toast])

  useEffect(()=>{
    setPointHistory(pointHistory.filter(point => point.submittedForName == studentName))
  },[studentName])

 



  if (loading) {
    return <Loading />
  }

  if (pointHistory.length === 0 && !studentName) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">No students found</h1>
        <p>Please ensure there are students in the system and try again.</p>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-xl mt-10">
      <div>
        <h1 className="text-3xl font-bold mb-6">View Students</h1>
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
                {pointHistory.map((history) => (
                <TableRow key={history._id}>
                <TableCell>{new Date(history.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(history.submittedAt).toLocaleTimeString([],{hour:"2-digit", minute:"2-digit"})}</TableCell>
                <TableCell>{history.submittedForName}</TableCell>
                <TableCell>{history.formType ?? "N/A"}</TableCell>
                <TableCell>{history.points}</TableCell>
                </TableRow>
            )).reverse()}
        </TableBody>
      </Table>

     

     
    </div>
  )
}