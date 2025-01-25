import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getPointHistory, getStudents } from "@/api"
import Loading from "../../Loading"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import {  X } from "lucide-react"
import { Input } from "@/components/ui/input"


export default function ViewPointHistoryTeacher() {
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [showPointHistory, setShowPointHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setfilteredStudents] = useState<any[]>([])
  const [isPopOverOpen, setIsPopOverOpen] = useState(false)
  const [studentId, setStudentId] = useState<string>("")
  const [studentName, setStudentName] = useState<string>("")
  
  useEffect(()=>{
        const fetchData = async () => {
            const token = localStorage.getItem('token')
            const resTeacher = await getStudents(token ?? "")
            setStudents(resTeacher.students)
            setfilteredStudents(resTeacher.students)
        }
          fetchData()
      },[])

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
          setShowPointHistory(data.pointHistory)
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
  useEffect(() => {
    fetchStudents()
  }, [toast])

  useEffect(()=>{
    setShowPointHistory(pointHistory.filter(point => point.submittedForName == studentName))
  },[studentName])

 



  if (loading) {
    return <Loading />
  }

  if (pointHistory.length === 0 && !studentName) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">No History found</h1>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-xl mt-10">
      <div>
        <h1 className="text-3xl font-bold mb-6">History</h1>
        {Array.isArray(students) && students.length > 0 ? (
  <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
    <div className="flex items-center space-x-2">
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        className="w-full justify-between"
      >
        {studentName
          ? students.find((s: any) => s._id === studentId)?.name
          : "Select student..."}
       
      </Button>
    </PopoverTrigger>
    <X 
        onClick={()=>{
          fetchStudents()
          setStudentId("")
          setStudentName("")
        }}
        className="ml-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer" />
    </div>
    <PopoverContent className="w-[600px] p-0 flex flex-col space-y-0">
          <Input onChange={(e)=>{
            const value = e.target.value
            setfilteredStudents(students.filter((s: any) => s.name.toLowerCase().includes(value.toLowerCase())))
          }} className="w-full" />
          {
            filteredStudents.map((s: any) => (
              <Button onClick={()=>{ 
                setStudentId(s._id)
                setStudentName(s.name)
                setIsPopOverOpen(false)
              }} key={s._id} className='justify-start' variant={"ghost"}>{s.name}</Button>
            ))
          }
    </PopoverContent>
  </Popover>
) : (
  <div>No students available</div>
)}
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
                {showPointHistory.map((history) => (
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
