import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getTeachers, deleteTeacher, updateTeacher } from "@/api";
import Loading from "../Loading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Modal from "./Modal";

export default function ViewTeachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null); // Store the teacher id to delete
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

        const data = await getTeachers(token);
        setTeachers(data.teachers);
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

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found.");

      await deleteTeacher(id, token);
      setTeachers((prev) => prev.filter((teacher) => teacher._id !== id));
      setShowModal(false); // Close the modal
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

  if (loading) {
    return <Loading />;
  }

  if (teachers.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">No teachers found</h1>
        <p>Please ensure there are teachers in the system and try again.</p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-xl mt-10">
      <h1 className="text-3xl font-bold mb-6">View Teachers</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher._id}>
              <TableCell>{teacher.name}</TableCell>
              <TableCell>{teacher.subject}</TableCell>
              <TableCell>{teacher.email}</TableCell>
              <TableCell>
                <Button
                  onClick={() => setEditingTeacher(teacher)}
                  className="mr-2 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    setTeacherToDelete(teacher._id); // Store the teacher id to delete
                    setShowModal(true); // Open the modal
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
                  setEditingTeacher({ ...editingTeacher, subject: e.target.value })
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
      />
    </div>
  );
}
