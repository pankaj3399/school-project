import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getTeachers,
  deleteTeacher,
  updateTeacher,
  sendVerificationMail,
} from "@/api";
import Loading from "../Loading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Modal from "./Modal";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { GRADE_OPTIONS } from "@/lib/types";

export default function ViewTeachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sendingVerification, setSendingVerification] = useState(false);
  const { toast } = useToast();
  const [customGrade, setCustomGrade] = useState("");

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "No token found.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const data = await getTeachers();
      console.log("API Response:", data); // Debug log

      // Handle different response structures
      let teachersArray = [];
      if (Array.isArray(data)) {
        teachersArray = data;
      } else if (data && Array.isArray(data.teachers)) {
        teachersArray = data.teachers;
      } else if (data && data.data && Array.isArray(data.data.teachers)) {
        teachersArray = data.data.teachers;
      } else if (data && data.data && Array.isArray(data.data)) {
        teachersArray = data.data;
      }

      console.log("Processed teachers array:", teachersArray); // Debug log

      if (teachersArray.length === 0) {
        console.warn("No teachers found in response");
      }

      setTeachers(
        teachersArray.sort(
          (a: any, b: any) => a.name?.localeCompare(b.name) || 0
        )
      );
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teacher data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [toast]); // Removed editingTeacher dependency to prevent unnecessary refetches

  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found.");

      await deleteTeacher(id, token);
      setTeachers((prev) => prev.filter((teacher) => teacher._id !== id));
      setShowModal(false);
      setTeacherToDelete(null);
      toast({
        title: "Success",
        description: "Teacher deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Error",
        description: "Failed to delete teacher.",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (updatedTeacher: any, id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found.");

      const updatedData = await updateTeacher(updatedTeacher, id, token);
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher._id === updatedData._id ? updatedData : teacher
        )
      );
      setEditingTeacher(null);
      toast({
        title: "Success",
        description: "Teacher updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Error",
        description: "Failed to update teacher.",
        variant: "destructive",
      });
    }
  };

  const handleSendVerification = async (email: string, teacherId: string) => {
    setSendingVerification(true);
    try {
      const data = await sendVerificationMail({
        email,
        role: "Teacher",
        url: `${window.location.origin}/verifyemail`,
        userId: teacherId,
      });

      toast({
        title: "Verification Email Status",
        description: data.data.message,
      });
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const getVerificationStatus = (teacher: any) => {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${teacher.isEmailVerified ? "bg-green-500" : "bg-amber-500"
            }`}
        ></span>
        <span className="text-sm">
          {teacher.isEmailVerified ? "Verified" : "Pending"}
        </span>
      </div>
    );
  };

  const filteredTeachers = teachers.filter((teacher) => {
    if (!teacher) return false; // Guard against null/undefined teachers

    const matchesGrade =
      selectedGrade === "all" ||
      (teacher.type === "Lead" && teacher.grade === selectedGrade);
    const matchesType = selectedType === "all" || teacher.type === selectedType;
    return matchesGrade && matchesType;
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-5 mt-10">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Teacher Roster</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTeachers} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            className="bg-[#00a58c] hover:bg-[#00a58c]"
            onClick={() => navigate("/addteacher")}
          >
            Add Teachers
          </Button>
        </div>
      </div>

      {editingTeacher && (
        <div className="mt-8 p-5 border rounded-xl bg-gray-50">
          <h2 className="text-2xl font-bold mb-4">Edit Teacher</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSubmit(editingTeacher, editingTeacher._id);
            }}
          >
            <div className="mb-4">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={editingTeacher.name || ""}
                onChange={(e) =>
                  setEditingTeacher({ ...editingTeacher, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Subject</label>
              <input
                type="text"
                value={editingTeacher.subject || ""}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher,
                    subject: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editingTeacher.email || ""}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...editingTeacher,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendingVerification}
                  onClick={() =>
                    handleSendVerification(
                      editingTeacher.email,
                      editingTeacher._id
                    )
                  }
                  className="whitespace-nowrap"
                >
                  {sendingVerification ? "Sending..." : "Verify Email"}
                </Button>
              </div>
              {!editingTeacher.isEmailVerified && (
                <p className="text-sm text-amber-600 mt-1">
                  Email not verified
                </p>
              )}
              {editingTeacher.isEmailVerified && (
                <p className="text-sm text-green-600 mt-1">Email verified</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Type</label>
              <select
                value={editingTeacher.type || "Lead"}
                onChange={(e) =>
                  setEditingTeacher({ ...editingTeacher, type: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              >
                <option value="Lead">Leader/Lead Teacher</option>
                <option value="Special">Team Member/Special Teacher</option>
              </select>
            </div>
            {editingTeacher.type === "Lead" && (
              <div className="mb-4 space-y-2">
                <label className="block text-sm font-medium">Grade</label>
                <Select
                  value={editingTeacher.grade || ""}
                  onValueChange={(value) => {
                    setEditingTeacher({ ...editingTeacher, grade: value });
                    if (value !== "OTHER") {
                      setCustomGrade("");
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {editingTeacher.grade === "OTHER" && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium">
                      Specify Grade/Room
                    </label>
                    <input
                      type="text"
                      value={customGrade}
                      onChange={(e) => {
                        setCustomGrade(e.target.value);
                        setEditingTeacher({
                          ...editingTeacher,
                          grade: e.target.value,
                        });
                      }}
                      className="w-full px-4 py-2 border rounded"
                      placeholder="Enter custom grade or room"
                      required
                    />
                  </div>
                )}
              </div>
            )}
            <div className="mb-4 flex items-center">
              <Checkbox
                checked={editingTeacher.recieveMails || false}
                onCheckedChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher,
                    recieveMails: e as boolean,
                  })
                }
              />
              <span className="text-sm ml-2">Receive Emails</span>
            </div>
            <div className="flex space-x-4">
              <Button
                type="submit"
                className="px-6 py-2 text-white bg-green-500 rounded hover:bg-green-600"
              >
                Save
              </Button>
              <Button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="px-6 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-4 my-6">
        <div className="w-48">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger>
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
        </div>

        <div className="w-48">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Lead">Leader/Lead Teacher</SelectItem>
              <SelectItem value="Special">
                Team Member/Special Teacher
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-2 bg-gray-100 text-sm">
          <p>Total teachers: {teachers.length}</p>
          <p>Filtered teachers: {filteredTeachers.length}</p>
          <p>Selected grade: {selectedGrade}</p>
          <p>Selected type: {selectedType}</p>
        </div>
      )}

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-2">No Teachers Found</h2>
          {teachers.length === 0 ? (
            <p className="text-gray-600">
              No teachers exist in the system. Click "Add Teachers" to get
              started.
            </p>
          ) : (
            <p className="text-gray-600">
              No teachers match the selected filters. Try adjusting your filters
              above.
            </p>
          )}
          <Button
            onClick={fetchTeachers}
            className="mt-4"
            variant="outline"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b-black">
              <TableHead className="text-gray-700">Name</TableHead>
              <TableHead className="text-gray-700">Subject</TableHead>
              <TableHead className="text-gray-700">Email</TableHead>
              <TableHead className="text-gray-700">Email Status</TableHead>
              <TableHead className="text-gray-700">Type</TableHead>
              <TableHead className="text-gray-700">Grade</TableHead>
              <TableHead className="text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher) => (
              <TableRow key={teacher._id} className="border-b-black">
                <TableCell>{teacher.name || "N/A"}</TableCell>
                <TableCell>{teacher.subject || "N/A"}</TableCell>
                <TableCell>{teacher.email || "N/A"}</TableCell>
                <TableCell>{getVerificationStatus(teacher)}</TableCell>
                <TableCell>
                  {teacher.type === "Lead"
                    ? "Leader/Lead Teacher"
                    : "Team Member/Special Teacher"}
                </TableCell>
                <TableCell>
                  {teacher.type === "Lead" ? teacher.grade || "N/A" : "N/A"}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => setEditingTeacher(teacher)}
                    className="mr-2 px-4 py-2 text-white bg-[#2DA194] rounded hover:bg-blue-800"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setTeacherToDelete(teacher._id);
                      setShowModal(true);
                    }}
                    className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setTeacherToDelete(null);
        }}
        onConfirm={() => {
          if (teacherToDelete) handleDelete(teacherToDelete);
        }}
        title="Confirm Deletion"
        description="Are you sure you want to delete this teacher? This action cannot be undone."
        callToAction="Delete"
      />
    </div>
  );
}
