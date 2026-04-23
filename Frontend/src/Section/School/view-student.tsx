import { useEffect, useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getStudents, deleteStudent, updateStudent, sendVerificationMail } from "@/api"
import Loading from "../Loading"
import { Checkbox } from "@/components/ui/checkbox"
import Modal from "./Modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSchoolSelectionGuard } from "@/hooks/useSchoolSelectionGuard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GRADE_OPTIONS } from "@/lib/types"

const STUDENT_GRADES = GRADE_OPTIONS

export default function ViewStudents() {
  const { isMultiSchoolUser, requiresSchoolSelection, selectedSchoolId } = useSchoolSelectionGuard()
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedQuery, setDebouncedQuery] = useState<string>("")
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [sendingVerification, setSendingVerification] = useState<string | null>(null);
  const { toast } = useToast()
  const fetchRequestRef = useRef(0);

  useEffect(() => {
    const requestId = ++fetchRequestRef.current;
    // Clear any modal / pending-delete state that referred to the previous school's students.
    setEditingStudent(null);
    setShowModal(false);
    setStudentToDelete(null);
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          toast({
            title: "Error",
            description: "No token found.",
            variant: "destructive",
          })
          if (requestId === fetchRequestRef.current) setLoading(false)
          return
        }

        if (requiresSchoolSelection) {
          if (requestId !== fetchRequestRef.current) return
          setStudents([])
          setFilteredStudents([])
          setLoading(false)
          return
        }

        const effectiveSchoolId = isMultiSchoolUser
          ? (selectedSchoolId || undefined)
          : undefined;

        const data = await getStudents(token, effectiveSchoolId)
        if (requestId !== fetchRequestRef.current) return

        if (data.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const studentsArray = Array.isArray(data?.students) ? data.students : [];

        const sortedStudents = [...studentsArray].sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""))
        setStudents(sortedStudents)
        setFilteredStudents(sortedStudents)
        setLoading(false)
      } catch (error) {
        if (requestId !== fetchRequestRef.current) return
        console.error("Unexpected error fetching student data (local/runtime error):", error)
        toast({
          title: "Runtime Error",
          description: "An unexpected error occurred while processing student data (local error).",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchStudents()
    return () => {
      fetchRequestRef.current += 1;
    };
  }, [selectedSchoolId, isMultiSchoolUser, requiresSchoolSelection, toast])


  // Debounce the search input so each keystroke doesn't re-filter large
  // rosters — the filter effect below reads debouncedQuery, not the raw value.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 250)
    return () => clearTimeout(id)
  }, [searchQuery])

  useEffect(() => {
    const query = debouncedQuery.trim().toLowerCase()
    const byGrade = selectedGrade === "all"
      ? students
      : students.filter(student => student.grade === selectedGrade)
    const result = query
      ? byGrade.filter((student) => {
          const name = (student.name || "").toLowerCase()
          const email = (student.email || "").toLowerCase()
          return name.includes(query) || email.includes(query)
        })
      : byGrade
    setFilteredStudents(result)
  }, [selectedGrade, debouncedQuery, students])



  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No token found.")

      const result = await deleteStudent(id, token)

      if (result.error) {
        throw new Error(result.error.message || "Failed to delete student")
      }

      setStudents((prev) => prev.filter((student) => student._id !== id))
      setFilteredStudents((prev) => prev.filter((student) => student._id !== id))

      toast({
        title: "Success",
        description: "Student deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Delete student error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student.",
        variant: "destructive",
      })
    } finally {
      setShowModal(false)
      setStudentToDelete(null)
    }
  }

  const handleUpdateSubmit = async (updatedStudent: any, id: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No token found.")

      const updatedData = await updateStudent(updatedStudent, id, token)
      setStudents((prev) =>
        prev.map((student) =>
          student._id === updatedData._id ? updatedData : student
        )
      )
      setEditingStudent(null)
      toast({
        title: "Success",
        description: "Student updated successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student.",
        variant: "destructive",
      })
    }
  }

  const handleSendVerification = async (email: string, studentId: string, isStudent = false, slot: 'student' | 'parent1' | 'parent2' = 'student') => {
    setSendingVerification(`${studentId}-${slot}`);
    try {
      const data = await sendVerificationMail({
        email,
        role: "Student",
        url: `${window.location.origin}/verifyemail`,
        userId: studentId,
        isStudent
      });

      toast({
        title: "Verification Email Status",
        description: data.data.message as string,
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive"
      });
    } finally {
      setSendingVerification(null);
    }
  };

  const getVerificationStatus = (student: any) => {
    const parent1Status = student.isParentOneEmailVerified;
    const parent2Status = student.isParentTwoEmailVerified;
    const emailStatus = student.isStudentEmailVerified;
    const hasParent2 = !!student.standard;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${emailStatus ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          <span className="text-sm">Student Email: {emailStatus ? 'Verified' : 'Pending'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${parent1Status ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          <span className="text-sm">Guardian 1: {parent1Status ? 'Verified' : 'Pending'}</span>
        </div>
        {hasParent2 && (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${parent2Status ? 'bg-green-500' : 'bg-amber-500'}`}></span>
            <span className="text-sm">Guardian 2: {parent2Status ? 'Verified' : 'Pending'}</span>
          </div>
        )}
      </div>
    );
  };

  const navigate = useNavigate();
  if (requiresSchoolSelection) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Please select a district and school from the top-right picker to view students.
      </div>
    )
  }

  if (loading) {
    return <Loading />
  }

  // if (students.length === 0) {
  //   return (
  //     <div className="text-center">
  //       <h1 className="text-xl font-bold">No students found</h1>
  //       <p>Please ensure there are students in the system and try again.</p>
  //     </div>
  //   )
  // }

  return (
    <div className="p-5 mt-10">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Student Roster</h1>
        <div className="flex gap-4">

          <Button
            className="bg-[#00a58c] hover:bg-[#00a58c]"
            onClick={() => navigate('/addstudent')}
          >
            Add Students
          </Button>
        </div>
      </div>

      <Dialog
        open={!!editingStudent}
        onOpenChange={(open) => {
          if (!open) {
            // Defer unmount until the Radix close animation completes (~200ms)
            // so the form contents don't vanish mid-animation.
            setTimeout(() => setEditingStudent(null), 200)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          {editingStudent && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdateSubmit(editingStudent, editingStudent._id)
            }}
          >
            <div className="mb-4">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={editingStudent.name}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editingStudent.email}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendingVerification === `${editingStudent._id}-student`}
                  onClick={() => handleSendVerification(editingStudent.email, editingStudent._id, true, 'student')}
                >
                  {sendingVerification === `${editingStudent._id}-student`
                    ? "Sending..."
                    : "Verify Email"}
                </Button>
              </div>
              {!editingStudent.isStudentEmailVerified && (
                <p className="text-sm text-amber-600 mt-1">Student email not verified</p>
              )}
              {editingStudent.isStudentEmailVerified && (
                <p className="text-sm text-green-600 mt-1">Student email verified</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Grade</label>
              <Select
                value={editingStudent.grade.toString()}
                onValueChange={(value) =>
                  setEditingStudent({
                    ...editingStudent,
                    grade: value
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium">Parent/Guardian Email 1</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editingStudent.parentEmail}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      parentEmail: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendingVerification === `${editingStudent._id}-parent1`}
                  onClick={() => handleSendVerification(editingStudent.parentEmail, editingStudent._id, false, 'parent1')}
                >
                  {sendingVerification === `${editingStudent._id}-parent1`
                    ? "Sending..."
                    : "Verify Email"}
                </Button>
              </div>
              {!editingStudent.isParentOneEmailVerified && (
                <p className="text-sm text-amber-600">Email not verified</p>
              )}
              {editingStudent.isParentOneEmailVerified && (
                <p className="text-sm text-green-600">Email verified</p>
              )}

              <label className="block text-sm font-medium mt-4">Parent/Guardian Email 2</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editingStudent.standard}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      standard: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendingVerification === `${editingStudent._id}-parent2`}
                  onClick={() => handleSendVerification(editingStudent.standard, editingStudent._id, false, 'parent2')}
                >
                  {sendingVerification === `${editingStudent._id}-parent2`
                    ? "Sending..."
                    : "Verify Email"}
                </Button>
              </div>
              {!editingStudent.isParentTwoEmailVerified && editingStudent.standard && (
                <p className="text-sm text-amber-600">Email not verified</p>
              )}
              {editingStudent.isParentTwoEmailVerified && (
                <p className="text-sm text-green-600">Email verified</p>
              )}
            </div>
            <Checkbox checked={editingStudent.sendNotifications} onCheckedChange={(e) => setEditingStudent({ ...editingStudent, sendNotifications: e as boolean })} className="mt-2" />
            <span className="text-sm ml-2 gap-x-1 inline-block text-semibold">Send email notification to Parents/Guardians.</span>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingStudent(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00a58c] hover:bg-[#008f7a] text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={selectedGrade}
          onValueChange={setSelectedGrade}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {GRADE_OPTIONS.map((grade) => (
              <SelectItem key={grade} value={grade}>
                {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            aria-label="Search students by name or email"
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {filteredStudents.length === 0 ? (
        <div className="text-center">
          <h2 className="text-xl font-bold">No Students Found</h2>
          <p>Please ensure there are students in the system and try again.</p>
        </div>
      ) : (
        <div className=" rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b-black">
                <TableHead className="text-gray-700">Student Name</TableHead>
                <TableHead className="text-gray-700">Student Email</TableHead>
                <TableHead className="text-gray-700">Guardian Email</TableHead>
                <TableHead className="text-gray-700">Grade</TableHead>
                <TableHead className="text-gray-700">Email Verification Status</TableHead>
                <TableHead className="text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student._id} className="border-b-black">
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.parentEmail || "N/A"}<br />{student.standard}</TableCell>
                  <TableCell>{student.grade || "N/A"}</TableCell>
                  <TableCell>{getVerificationStatus(student)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="mr-2 px-4 py-2 text-white bg-[#00a58c] hover:bg-[#008f76] focus:outline-none focus:ring-2 focus:ring-[#00a58c]/40 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setStudentToDelete(student._id)
                        setShowModal(true)
                      }}
                      className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Modal for deletion confirmation */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => studentToDelete && handleDelete(studentToDelete)}
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone."
        callToAction="Delete"
        variant="danger"
      />
    </div>

  )
}