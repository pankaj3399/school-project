import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";
import Loading from "../Loading";
import { teacherRoster } from "@/api";

interface TeacherData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  subject: string;
  type: "Lead" | "Special";
  grade?: string;
}

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TeacherData | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform the data
        const transformedData: TeacherData[] = jsonData.map((row: any) => {
          // Convert Excel date number to actual date
          let dob = row['Date of Birth'];
          if (typeof dob === 'number') {
            // Convert Excel date number to JavaScript date
            dob = new Date((dob - 25569) * 86400 * 1000).toISOString().split('T')[0];
          }

          return {
            firstName: row['First Name'] || '',
            lastName: row['Last Name'] || '',
            dateOfBirth: dob || '',
            email: row['Email'] || '',
            subject: row['Subject'] || '',
            type: row['Type of Teacher'] === 'Lead Teacher' ? 'Lead' : 'Special',
            grade: row['Grade'] || ''
          }
        });

        setTeachers(transformedData);
        toast({
          title: "Success",
          description: `Loaded ${transformedData.length} teachers from file`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process Excel file",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmitRoster = async () => {
    setLoading(true);
    try {
      let formattedTeachers = teachers.map((teacher) => ({
        ...teacher,
        dateOfBirth: new Date(teacher.dateOfBirth).toISOString(),
        name: `${teacher.firstName} ${teacher.lastName}`,
        firstName: undefined,
        lastName: undefined,
      }))
      const response = await teacherRoster({teachers: formattedTeachers});
      if (!response.success) throw new Error('Failed to submit roster');

      toast({
        title: "Success",
        description: "Teacher roster submitted successfully",
      });
      setTeachers([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit teacher roster",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...teachers[index] });
  };

  const handleSaveEdit = (index: number) => {
    if (!editForm) return;
    const newTeachers = [...teachers];
    newTeachers[index] = editForm;
    setTeachers(newTeachers);
    setEditingIndex(null);
    setEditForm(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Teacher Roster Setup</h1>
      
      <div className="mb-6">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="mb-4"
        />
        <p className="text-sm text-gray-500 mb-2">
          Upload Excel file with columns: First Name, Last Name, Date of Birth, Email, Subject, Type of Teacher
        </p>
      </div>

      {teachers.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher, index) => (
                <TableRow key={index}>
                  {editingIndex === index ? (
                    <>
                      <TableCell>
                        <Input
                          value={editForm?.firstName}
                          onChange={(e) => setEditForm({ ...editForm!, firstName: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.lastName}
                          onChange={(e) => setEditForm({ ...editForm!, lastName: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={editForm?.dateOfBirth}
                          onChange={(e) => setEditForm({ ...editForm!, dateOfBirth: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.email}
                          onChange={(e) => setEditForm({ ...editForm!, email: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.subject}
                          onChange={(e) => setEditForm({ ...editForm!, subject: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          value={editForm?.type}
                          onChange={(e) => setEditForm({ ...editForm!, type: e.target.value as "Lead" | "Special" })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="Lead">Leader/Lead Teacher</option>
                          <option value="Special">Team Member/Teacher</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {editForm?.type === 'Lead' && (
                          <Input
                            value={editForm?.grade}
                            onChange={(e) => setEditForm({ ...editForm!, grade: e.target.value })}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleSaveEdit(index)} className="mr-2">Save</Button>
                        <Button onClick={() => setEditingIndex(null)} variant="outline">Cancel</Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{teacher.firstName}</TableCell>
                      <TableCell>{teacher.lastName}</TableCell>
                      <TableCell>{new Date(teacher.dateOfBirth).toLocaleDateString()}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.subject}</TableCell>
                      <TableCell>{teacher.type === 'Lead' ? 'Leader/Lead Teacher' : 'Team Member/Teacher'}</TableCell>
                      <TableCell>{teacher.type === 'Lead' ? teacher.grade : 'N/A'}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleEdit(index)} variant="outline">Edit</Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6">
            <Button onClick={handleSubmitRoster} className="bg-[#00a58c]">
              Submit Roster
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
