import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getPointHistory, getStudents } from "@/api"
import Loading from "../../Loading"
import { SelectContent, SelectItem, SelectTrigger, SelectValue, Select } from "@/components/ui/select"
import { useAuth } from "@/authContext"

export default function ViewPointHistoryTeacher() {
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [showPointHistory, setShowPointHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [studentId, setStudentId] = useState<string>("")
  const [studentName, setStudentName] = useState<string>("")
  const { user } = useAuth();
  
  // Helper function to format date and time with timezone
  const formatDateTime = (date: string | number | Date, format: 'date' | 'time') => {
    try {
      const dateObj = new Date(date);
      
      // Get timezone from user's school or default to local
      const timezone = user?.schoolId?.timezone;
      
      // If timezone exists and starts with UTC, parse it
      if (timezone && typeof timezone === 'string' && timezone.startsWith('UTC')) {
        // Extract offset hours (e.g., "UTC-5" => -5)
        const offset = parseInt(timezone.replace('UTC', '')) || 0;
        
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'UTC', // Start with UTC
          ...(format === 'date' 
            ? { year: 'numeric', month: '2-digit', day: '2-digit' } 
            : { hour: '2-digit', minute: '2-digit', hour12: true })
        };
        
        // Format in UTC
        const formatted = new Intl.DateTimeFormat('en-US', options).format(dateObj);
        
        // For non-zero offsets, we need to manually adjust the date
        if (offset !== 0 && format === 'time') {
          // Create a new date object with the offset applied
          const adjustedDate = new Date(dateObj.getTime() + (offset * 60 * 60 * 1000));
          return new Intl.DateTimeFormat('en-US', options).format(adjustedDate);
        }
        
        return formatted;
      }
      
      // Fall back to browser's local timezone
      return format === 'date' 
        ? dateObj.toLocaleDateString() 
        : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error('Error formatting date:', err);
      return format === 'date' ? 'Invalid Date' : 'Invalid Time';
    }
  };

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
          {showPointHistory.map((history) => (
            <TableRow key={history._id}>
              <TableCell>{formatDateTime(history.submittedAt, 'date')}</TableCell>
              <TableCell>{formatDateTime(history.submittedAt, 'time')}</TableCell>
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