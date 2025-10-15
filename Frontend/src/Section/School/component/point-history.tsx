import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getPointHistory, getStudents, getHistoryByTime, getFilteredPointHistory } from "@/api"
import { FormType } from '@/lib/types'
import Loading from "../../Loading"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/authContext"
import { timezoneManager } from "@/lib/luxon"
import { useSearchParams } from "react-router-dom"

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
  const [filteredPointHistory, setFilteredPointHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setfilteredStudents] = useState<any[]>([])
  const [isPopOverOpen, setIsPopOverOpen] = useState(false)
  const [studentId, setStudentId] = useState<string>("")
  const [studentName, setStudentName] = useState<string>("")
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const formTypeFromUrl = searchParams.get('formType') || '';

  // Pagination state
  const [pagination, setPagination] = useState<PaginationData>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 20
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const resTeacher = await getStudents(token ?? "")
      setStudents(resTeacher.students)
      setfilteredStudents(resTeacher.students)
    }
    fetchData()
  }, [])

  const fetchStudents = async (page: number = 1) => {
    try {
      setLoading(true);
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
      let data;

      // If formType is specified in URL, use the filtered API
      // Use '1W' (1 week) to match analytics page default period
      if (formTypeFromUrl) {
        console.log('=== Point History: Fetching filtered data ===');
        console.log('Form Type:', formTypeFromUrl);
        console.log('Period: 1W (matching analytics page)');

        // Backend automatically includes AwardPointsIEP when fetching AwardPoints
        data = await getHistoryByTime({
          formType: formTypeFromUrl,
          period: '1W'
        });
        console.log('History length:', data.history?.length);

        // Convert the filtered data to match the expected format
        if (data.history) {
          setPointHistory(data.history || []);
          setShowPointHistory(data.history || []);
          // For filtered data, we don't have pagination, so set a basic pagination
          setPagination({
            totalItems: data.history?.length || 0,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: data.history?.length || 0
          });
        }
      } else {
        // Use the original pagination API for unfiltered data
        data = await getPointHistory(token, page, pagination.itemsPerPage);

        // Handle pagination data
        if (data.pagination) {
          setPagination(data.pagination);
        }

        setPointHistory(data.pointHistory || []);
        setShowPointHistory(data.pointHistory || []);
      }
      setLoading(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch point history.",
        variant: "destructive",
      })
      console.log(error);

      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [formTypeFromUrl]) // Reload when formType changes

  useEffect(() => {
    setShowPointHistory(filteredPointHistory)
  }, [studentName, filteredPointHistory])

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchStudents(newPage);
  };

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

  const formatFormType = (formType: string) => {
    if (formType === FormType.AwardPointsIEP) {
      return "Award Points with Individualized Education Plan (IEP)";
    }
    return formType
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
        <h1 className="text-3xl font-bold mb-6">
          Point History
          {formTypeFromUrl && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {formatFormType(formTypeFromUrl)}
            </span>
          )}
        </h1>

        {Array.isArray(students) && students.length > 0 ? (
          <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
            <div className="flex items-center space-x-3 w-full max-w-md">
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
              {studentName && (
                <X
                  onClick={() => {
                    fetchStudents(1)
                    setStudentId("")
                    setStudentName("")
                  }}
                  className="h-5 w-5 shrink-0 opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
                />
              )}
            </div>
            <PopoverContent className="w-[600px] p-0 flex flex-col space-y-0 max-h-[300px] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white p-2 border-b">
                <Input onChange={(e) => {
                  const value = e.target.value
                  setfilteredStudents(students.filter((s: any) => s.name.toLowerCase().includes(value.toLowerCase()) || s.grade.toLowerCase().includes(value.toLowerCase())))

                }} className="w-full" placeholder="Search students..." />
              </div>
              <div className="p-0">
                {filteredStudents.map((s: any) => (
                  <Button onClick={async () => {
                    setStudentId(s._id)
                    setStudentName(s.name)
                    setIsPopOverOpen(false)
                    const token = localStorage.getItem('token');
                    if (!token) {
                      console.log('Token not provided')
                      return
                    }
                    const data = await getFilteredPointHistory(token, s._id)
                    setFilteredPointHistory(data.pointHistory)
                  }} key={s._id} className='justify-start w-full rounded-none' variant={"ghost"}>{s.name} ({s.grade})</Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="p-4 bg-gray-50 rounded-md text-gray-600 border border-gray-200">No students available</div>
        )}
      </div>

      {/* Table Section with improved styling */}
      <div className="border rounded-md overflow-hidden mb-6">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Time</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Teacher</TableHead>
              <TableHead className="font-semibold">Subject</TableHead>
              <TableHead className="font-semibold">Action</TableHead>
              <TableHead className="font-semibold">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showPointHistory.length > 0 ? (
              showPointHistory.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()).map((history) => (
                <TableRow key={history._id}>
                  <TableCell>{formatDateTime(history.submittedAt, 'date')}</TableCell>
                  <TableCell>{formatDateTime(history.submittedAt, 'time')}</TableCell>
                  <TableCell>{history.submittedForName}</TableCell>
                  <TableCell>{history.submittedByName ?? "-"}</TableCell>
                  <TableCell>{history.submittedBySubject ?? "-"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-gray-800 text-sm">
                      {formatFormType(history.formType) ?? "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className={history.points >= 0 ? "text-gray-800 font-medium" : "text-gray-800 font-medium"}>
                    {history.points}
                  </TableCell>
                </TableRow>
              )).reverse()
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls with improved styling */}
      {!studentName && <div className="flex items-center justify-between border-t pt-4 mt-4">
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
      </div>}
    </div>
  )
}