import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Loading from "../../Loading"


export default function ViewPointHistoryByData({data}:{
    data:any[]
}) {
  const [pointHistory, setPointHistory] = useState<any[]>(data)
  const [showPointHistory, setShowPointHistory] = useState<any[]>(data)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
    

  useEffect(() => {
    
    setPointHistory(data)
    setShowPointHistory(data)
    setLoading(false)
  }, [toast, data])



 



  if (loading) {
    return <Loading />
  }

  if (pointHistory.length === 0 ) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">No History found</h1>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-xl mt-10">
      <div>
      </div>
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
                {showPointHistory.map((history) => (
                <TableRow key={history._id}>
                <TableCell>{new Date(history.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(history.submittedAt).toLocaleTimeString([],{hour:"2-digit", minute:"2-digit"})}</TableCell>
                <TableCell>{history.submittedForName}</TableCell>
                <TableCell>{history.submittedByName}</TableCell>
                <TableCell>{history.formType ?? "N/A"}</TableCell>
                <TableCell>{history.points}</TableCell>
                </TableRow>
            )).reverse()}
        </TableBody>
      </Table>

     

     
    </div>
  )
}
