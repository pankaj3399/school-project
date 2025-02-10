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
import { getTeachers, deleteTeacher, updateTeacher } from "@/api";
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

const GRADE_OPTIONS = [
  'K',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'ADAPTIVE LEARNING ROOM',
  'ALTERNATIVE LEARNING CENTER',
  'AN CENTER',
  'ASD',
  'BEHAVIORAL ROOM',
  'GENERAL EDUCATION',
  'HOMEBOUND ROOM',
  'HOMEROOM',
  'LIFE SKILLS CLASSROOM',
  'PROGRAM #1',
  'PROGRAM #2',
  'PROGRAM #3',
  'RESOURCE ROOM',
  'SENSORY ROOM',
  'SPECIAL DAY CLASS',
  'SPECIALIZED ROOM',
  'THERAPEUTIC ROOM',
  'TRANSITION PROGRAM',
  'OTHER'
];

export default function ViewTeachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
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
        setTeachers(data.teachers.sort((a: any, b: any) => a.name.localeCompare(b.name)));
        setLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch teacher data.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [toast, editingTeacher]);

  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found.");

      await deleteTeacher(id, token);
      setTeachers((prev) => prev.filter((teacher) => teacher._id !== id));
      setShowModal(false);
      toast({
        title: "Success",
        description: "Teacher deleted successfully.",
        variant: "default",
      });
    } catch (error) {
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
      toast({
        title: "Error",
        description: "Failed to update teacher.",
        variant: "destructive",
      });
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesGrade = selectedGrade === "all" || 
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
        <Button className="bg-[#00a58c] hover:bg-[#00a58c]" onClick={() => navigate('/addteacher')}>
          Add Teachers
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
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
              <SelectItem value="Special">Team Member/Speacial Teacher</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center">
          <h2 className="text-xl font-bold">No Teachers Found</h2>
          <p>No teachers match the selected filters. Try adjusting your filters or ensure there are teachers in the system.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b-black">
              <TableHead className="text-gray-700">Name</TableHead>
              <TableHead className="text-gray-700">Subject</TableHead>
              <TableHead className="text-gray-700">Email</TableHead>
              <TableHead className="text-gray-700">Type</TableHead>
              <TableHead className="text-gray-700">Grade</TableHead>
              <TableHead className="text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher) => (
              <TableRow key={teacher._id} className="border-b-black">
                <TableCell>{teacher.name}</TableCell>
                <TableCell>{teacher.subject}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.type == "Lead" ? 'Leader/Lead Teacher':'Team Member/Speacial Teacher'}</TableCell>
                <TableCell>{teacher.type === 'Lead' ? teacher.grade : 'N/A'}</TableCell>
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
                value={editingTeacher.name}
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
                value={editingTeacher.subject}
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
              <input
                type="email"
                value={editingTeacher.email}
                onChange={(e) =>
                  setEditingTeacher({ ...editingTeacher, email: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Type</label>
              <select
                value={editingTeacher.type}
                onChange={(e) =>
                  setEditingTeacher({ ...editingTeacher, type: e.target.value })
                }
                className="w-full px-4 py-2 border rounded"
              >
                <option value="Lead">Lead</option>
                <option value="Special">Special</option>
              </select>
            </div>
            {editingTeacher.type === 'Lead' && (
              <div className="mb-4">
                <label className="block text-sm font-medium">Grade</label>
                <input
                  type="number"
                  value={editingTeacher.grade}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, grade: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded"
                  min={1}
                />
              </div>
            )}
            <div className="mb-4 flex items-center">
              <Checkbox
                checked={editingTeacher.recieveMails}
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
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