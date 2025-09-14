import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getPointHistory, getStudents } from "@/api"
import { FormType } from '@/lib/types'
import Loading from "../../Loading"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/authContext"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { timezoneManager } from "@/lib/luxon"

// Define pagination interface
interface PaginationData {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export default function ViewPointHistoryTeacher() {
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [showPointHistory, setShowPointHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [studentId, setStudentId] = useState<string>("")
  const [studentName, setStudentName] = useState<string>("")
  const { user } = useAuth();
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationData>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20
  });
  
  // Helper function to format date and time with timezone
  const formatDateTime = (date: string | number | Date, format: 'date' | 'time') => {
    try {
      // Use the school's timezone if available
      console.log("Formatting date in school's timezone:", user);
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
    const fetchData = async () => {
      console.log("=== TEACHER POINTS HISTORY DEBUG ===");
      const token = localStorage.getItem('token')
      console.log("Token:", token ? "exists" : "missing");
      const resTeacher = await getStudents(token ?? "")
      console.log("Students response:", resTeacher);
      console.log("Students array:", resTeacher.students);
      setStudents(resTeacher.students)
    }
    fetchData()
  }, [])

  const fetchPointHistoryData = async (page: number = 1) => {
    try {
      console.log("=== FETCHING POINT HISTORY ===");
      console.log("Page:", page);
      console.log("Items per page:", pagination.itemsPerPage);
      setLoading(true);
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("ERROR: No token found");
        toast({
          title: "Error",
          description: "No token found.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      console.log("Making API call to getPointHistory...");
      const data = await getPointHistory(token, page, pagination.itemsPerPage);
      console.log("Point history response:", data);

      // Update pagination info
      if (data.pagination) {
        console.log("Pagination info:", data.pagination);
        setPagination(data.pagination);
      }

      console.log("Point history data:", data.pointHistory);
      setPointHistory(data.pointHistory || [])
      setShowPointHistory(data.pointHistory || [])
      setLoading(false)
    } catch (error) {
      console.error("=== ERROR FETCHING POINT HISTORY ===");
      console.error("Error:", error);
      console.error("Error response:", error.response?.data);
      toast({
        title: "Error",
        description: "Failed to fetch point history.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPointHistoryData()
  }, []) // Load initial page

  useEffect(() => {
    console.log("=== FILTERING POINT HISTORY ===");
    console.log("Selected student name:", studentName);
    console.log("Total point history:", pointHistory.length);
    const filtered = pointHistory.filter(point => point.submittedForName == studentName);
    console.log("Filtered point history:", filtered.length);
    console.log("Filtered data:", filtered);
    setShowPointHistory(filtered);
  }, [studentName, pointHistory])

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchPointHistoryData(newPage);
  };

  const clearFilter = () => {
    setStudentId("");
    setStudentName("");
    fetchPointHistoryData(1);
  };

   const formatFormType = (formType: string) => {
    if(formType === FormType.AwardPointsIEP) {
      return "Award Points with Individualized Education Plan (IEP)";
    }else{
      return formType;
    }
  }

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
    <div className="p-8 bg-white rounded-xl shadow-xl mt-10">
      {/* Header Section with improved spacing */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Point History</h1>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="grow max-w-md relative">
            <Select value={studentId} onValueChange={(value) => {
              console.log("=== STUDENT SELECTED IN POINTS HISTORY ===");
              console.log("Selected student ID:", value);
              const selectedStudent = students.filter(student => value === student._id)[0];
              console.log("Selected student object:", selectedStudent);
              const selectedName = selectedStudent?.name || "";
              console.log("Selected student name:", selectedName);
              setStudentId(value)
              setStudentName(selectedName)
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Student" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="p-2 sticky top-0 z-10 bg-white border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search students..." 
                      className="pl-8" 
                     
                    />
                  </div>
                </div>
                {students && students.map((student: any) => (
                  <SelectItem key={student._id} value={student._id}>
                    {student.name} (Grade {student.grade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {studentId && (
            <Button 
              variant="outline" 
              onClick={clearFilter} 
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span>Clear Filter</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Table Section with improved styling */}
      <div className="border rounded-md overflow-hidden mb-6">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Time</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Action</TableHead>
              <TableHead className="font-semibold">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showPointHistory.length > 0 ? (
              showPointHistory.sort((a,b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()).map((history) => (
                <TableRow key={history._id} className="hover:bg-gray-50">
                  <TableCell>{formatDateTime(history.submittedAt, 'date')}</TableCell>
                  <TableCell>{formatDateTime(history.submittedAt, 'time')}</TableCell>
                  <TableCell className="font-medium">{history.submittedForName}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-gray-800 text-sm">
                      {formatFormType(history.formType) ?? "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className={history.points >= 0 ? "text-gray-800 font-medium" : "text-gray-800 font-medium"}>
                    {history.points}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No records found. {studentId ? "Try selecting a different student." : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Improved pagination controls */}
      <div className="flex items-center justify-between border-t pt-4 mt-4">
        <div className="text-sm text-gray-500">
          Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries
        </div>
        <div className="space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          
          {pagination.totalPages > 0 && (
            <>
              {/* First page button if not in first few pages */}
              {pagination.currentPage > 3 && (
                <>
                  <Button
                    variant={1 === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    className="h-8 w-8 p-0"
                  >
                    1
                  </Button>
                  {pagination.currentPage > 4 && (
                    <span className="mx-1">...</span>
                  )}
                </>
              )}
              
              {/* Page buttons showing around current page */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNumber;
                
                if (pagination.currentPage <= 3) {
                  // If near start, show first 5 pages
                  pageNumber = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  // If near end, show last 5 pages
                  pageNumber = pagination.totalPages - 4 + i;
                } else {
                  // Show 2 pages before and 2 pages after current
                  pageNumber = pagination.currentPage - 2 + i;
                }
                
                if (pageNumber > 0 && pageNumber <= pagination.totalPages) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                }
                return null;
              })}
              
              {/* Last page button if not in last few pages */}
              {pagination.currentPage < pagination.totalPages - 2 && (
                <>
                  {pagination.currentPage < pagination.totalPages - 3 && (
                    <span className="mx-1">...</span>
                  )}
                  <Button
                    variant={pagination.totalPages === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className="h-8 w-8 p-0"
                  >
                    {pagination.totalPages}
                  </Button>
                </>
              )}
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}