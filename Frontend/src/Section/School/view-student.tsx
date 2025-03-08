import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getStudents, deleteStudent, updateStudent, sendVerificationMail } from "@/api"
import Loading from "../Loading"
import { Checkbox } from "@/components/ui/checkbox"
import Modal from "./Modal"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STUDENT_GRADES = [
  'K',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'AN CENTER'
];

export default function ViewStudents() {
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [sendingVerification, setSendingVerification] = useState(false);
  const { toast } = useToast()

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

        const data = await getStudents(token)
        const sortedStudents = data.students.sort((a: any, b: any) => a.name.localeCompare(b.name))
        setStudents(sortedStudents)
        setFilteredStudents(sortedStudents)
        setLoading(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch student data.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchStudents()
  }, [toast, editingStudent])


  useEffect(() => {
    if (selectedGrade === "all") {
      setFilteredStudents(students)
    } else {
      setFilteredStudents(students.filter(student => student.grade === selectedGrade))
    }
  }, [selectedGrade, students])



  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No token found.")

      await deleteStudent(id, token)
      setStudents((prev) => prev.filter((student) => student._id !== id))
      toast({
        title: "Success",
        description: "Student deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student.",
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

  const handleSendVerification = async (email: string, studentId: string) => {
    setSendingVerification(true);
    try {
      await sendVerificationMail({
        email,
        role: "Student",
        url: `${window.location.origin}/verifyemail`,
        userId: studentId
      });
      
      toast({
        title: "Verification Email Sent",
        description: "A verification email has been sent to the parent.",
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive"
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const getVerificationStatus = (student: any) => {
    const parent1Status = student.isParentOneEmailVerified;
    const parent2Status = student.isParentTwoEmailVerified;
    const hasParent2 = !!student.standard;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${parent1Status ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          <span className="text-sm">Email 1: {parent1Status ? 'Verified' : 'Pending'}</span>
        </div>
        {hasParent2 && (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${parent2Status ? 'bg-green-500' : 'bg-amber-500'}`}></span>
            <span className="text-sm">Email 2: {parent2Status ? 'Verified' : 'Pending'}</span>
          </div>
        )}
      </div>
    );
  };

  const navigate = useNavigate();
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

      {/* Move Edit Form to top */}
      {editingStudent && (
        <div className="mb-8 p-5 border rounded-xl bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Edit Student</h2>
            <Button
              variant="outline"
              onClick={() => setEditingStudent(null)}
              className="text-gray-500"
            >
              ✕
            </Button>
          </div>
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
              {/* <label className="block text-sm font-medium">Class</label> */}
             
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Email</label>
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
                  disabled={sendingVerification}
                  onClick={() => handleSendVerification(editingStudent.parentEmail, editingStudent._id)}
                >
                  {sendingVerification ? "Sending..." : "Verify Email"}
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
                  disabled={sendingVerification}
                  onClick={() => handleSendVerification(editingStudent.standard, editingStudent._id)}
                >
                  {sendingVerification ? "Sending..." : "Verify Email"}
                </Button>
              </div>
              {!editingStudent.isParentTwoEmailVerified && editingStudent.standard && (
                <p className="text-sm text-amber-600">Email not verified</p>
              )}
              {editingStudent.isParentTwoEmailVerified && (
                <p className="text-sm text-green-600">Email verified</p>
              )}
            </div>
            <Checkbox checked={editingStudent.sendNotifications} onCheckedChange={(e)=>setEditingStudent({...editingStudent,sendNotifications:e as boolean})} className="mt-2" />
              <span className="text-sm ml-2 gap-x-1 inline-block text-semibold">Send email notification to Parents/Guardians.</span>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-2 text-white bg-green-500 rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-6 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <Select
          value={selectedGrade}
          onValueChange={setSelectedGrade}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                Grade {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              <TableHead className="text-gray-700">Name</TableHead>
              <TableHead className="text-gray-700">Email</TableHead>
              <TableHead className="text-gray-700">Parents/Guardians Email</TableHead>
              <TableHead className="text-gray-700">Grade</TableHead>
              <TableHead className="text-gray-700">Guardian Email Status</TableHead>
              <TableHead className="text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student._id} className="border-b-black">
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.parentEmail || "N/A"}<br/>{student.standard}</TableCell>
                <TableCell>{student.grade || "N/A"}</TableCell>
                <TableCell>{getVerificationStatus(student)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => setEditingStudent(student)}
                    className="mr-2 px-4 py-2 text-white bg-[#00a58c] hover:bg-[#00a58c]"
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
      />
    </div>
    
  )
}