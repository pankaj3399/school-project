import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Loading from "../../Loading"
import { useAuth } from "@/authContext"
import { timezoneManager } from "@/lib/luxon"
import { FormType } from '@/lib/types'

export default function ViewPointHistoryByData({data}:{
    data:any[]
}) {
  const [pointHistory, setPointHistory] = useState<any[]>(data)
  const [showPointHistory, setShowPointHistory] = useState<any[]>(data)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth();
  
  // Helper function to format date and time with timezone
  const formatDateTime = (date: string | number | Date, format: 'date' | 'time') => {
    try {
      // Use the school's timezone if available
      if (user?.schoolId?.timeZone) {
        if (format === 'date') {
          return timezoneManager.formatForSchool(date as string | Date, user.schoolId.timeZone, 'MM/dd/yyyy');
        } else {
          return timezoneManager.formatForSchool(date as string | Date, user.schoolId.timeZone, 'h:mm a');
        }
      }
      
      // Fall back to browser's local timezone
      const dateObj = new Date(date);
      return format === 'date' 
        ? dateObj.toLocaleDateString() 
        : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error('Error formatting date:', err);
      return format === 'date' ? 'Invalid Date' : 'Invalid Time';
    }
  };

  useEffect(() => {
    setPointHistory(data)
    setShowPointHistory(data)
    setLoading(false)
  }, [toast, data])

   const formatFormType = (formType: string) => {
    if(formType === FormType.AwardPointsIEP) {
      return "Award Points with Individualized Education Plan (IEP)";
    }else{
       return formType
    }
  }

  if (loading) {
    return <Loading />
  }

  if (pointHistory.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">No History found</h1>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-xl mt-10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {showPointHistory.sort((a,b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()).map((history) => (
            <TableRow key={history._id}>
              <TableCell>{formatDateTime(history.submittedAt, 'date')}</TableCell>
              <TableCell>{formatDateTime(history.submittedAt, 'time')}</TableCell>
              <TableCell>{history.submittedForName}</TableCell>
              <TableCell>{history.submittedByName}</TableCell>
              <TableCell>{formatFormType(history.formType) ?? "N/A"}</TableCell>
              <TableCell>{history.points}</TableCell>
            </TableRow>
          )).reverse()}
        </TableBody>
      </Table>
    </div>
  )
}
