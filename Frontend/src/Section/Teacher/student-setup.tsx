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
import { studentRoster } from "@/api";

interface StudentData {
  firstName: string;
  lastName: string;
  grade: string;
  studentNumber: string;
  guardian1: {
    name: string;
    email: string;
    phone1: string;
    phone2?: string;
  };
  guardian2: {
    name: string;
    email: string;
    phone1: string;
    phone2?: string;
  } | null;
}

// interface GuardianInfo {
//   name: string;
//   email: string;
//   phone1: string;
//   phone2?: string;
// }

// function parseGuardianString(guardianString: string): GuardianInfo {
//   try {
//     // Split at Email: to separate name and contact info
//     const [fullName, remainingInfo] = guardianString.split('Email:');
    
//     // Extract email (assumes email ends with a space followed by C: or Oth:)
//     const emailMatch = remainingInfo.match(/([^\s]+)(?=\s+[CO])/);
//     const email = emailMatch ? emailMatch[0] : '';
    
//     // Extract phone numbers
//     const phone1Match = remainingInfo.match(/C:\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
//     const phone2Match = remainingInfo.match(/Oth:\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/);
    
//     // Clean up phone numbers
//     const phone1 = phone1Match ? phone1Match[0].replace('C:', '').trim() : '';
//     const phone2 = phone2Match ? phone2Match[0].replace('Oth:', '').trim() : '';

//     return {
//       name: fullName.trim(),
//       email: email.trim(),
//       phone1,
//       phone2
//     };
//   } catch (error) {
//     console.error('Error parsing guardian string:', error);
//     return {
//       name: '',
//       email: '',
//       phone1: '',
//       phone2: ''
//     };
//   }
// }

export default function SetupStudents() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<StudentData | null>(null);
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

        const transformedData: StudentData[] = jsonData.map((row: any) => {
          // Use direct column values instead of parsing from combined fields
          const guardian1 = {
            name: row['Guardian 1 Name'] || '',
            email: row['Guardian 1 Email'] || '',
            phone1: row['Guardian 1 Phone'] || '',
            phone2: row['Guardian 1 Phone 2'] || ''
          };

          // Check if Guardian 2 data exists
          let guardian2 = null;
          if (row['Guardian 2 Name'] || row['Guardian 2 Email'] || row['Guardian 2 Phone']) {
            guardian2 = {
              name: row['Guardian 2 Name'] || '',
              email: row['Guardian 2 Email'] || '',
              phone1: row['Guardian 2 Phone'] || '',
              phone2: row['Guardian 2 Phone 2'] || ''
            };
          }

          return {
            firstName: row['First Name'] || '',
            lastName: row['Last Name'] || '',
            grade: row['Grade']?.toString() || '',
            studentNumber: row['Student Number']?.toString() || '',
            guardian1: guardian1,
            guardian2: guardian2
          };
        });

        console.log('Processed Student Data:', transformedData);
        setStudents(transformedData);
        
        toast({
          title: "Success",
          description: `Loaded ${transformedData.length} students from file`,
        });
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: "Error",
          description: "Failed to process Excel file",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...students[index] });
  };

  const handleSaveEdit = (index: number) => {
    if (!editForm) return;
    const newStudents = [...students];
    newStudents[index] = editForm;
    setStudents(newStudents);
    setEditingIndex(null);
    setEditForm(null);
  };

  const validateStudentData = (): boolean => {
    const errors: string[] = [];
    
    students.forEach((student, index) => {
      const identifier = student.studentNumber || `${student.firstName} ${student.lastName}` || `Row ${index + 1}`;
      
      // Check Guardian 1 data completeness
      const g1 = student.guardian1;
      if (!g1.name || !g1.email || !g1.phone1) {
        errors.push(`Student ${identifier}: Missing required Guardian 1 information (${!g1.name ? 'name' : ''}${!g1.email ? ', email' : ''}${!g1.phone1 ? ', phone' : ''}).`);
      } else if (!g1.email.includes('@')) {
        errors.push(`Student ${identifier}: Guardian 1 email format is invalid.`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitRoster = async () => {
    if (!validateStudentData()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const formattedStudents = students.map((student) => ({
        ...student,
        name: `${student.firstName} ${student.lastName}`,
        email: student.studentNumber + "@school.com",
        parentEmail: student.guardian1.email,
        standard: student.guardian2?.email || "",
        firstName: undefined,
        lastName: undefined,
      }));

      const response = await studentRoster({ students: formattedStudents });
      if (!response.success) throw new Error('Failed to submit roster');

      toast({
        title: "Success",
        description: "Student roster submitted successfully",
      });
      setStudents([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit student roster",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Student Roster Setup</h1>
      
      <div className="mb-6">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="mb-4"
        />
        <p className="text-sm text-gray-500 mb-2">
          Upload Excel file with columns: First Name, Last Name, Grade, Student Number, Guardian 1 Name, Guardian 1 Email, Guardian 1 Phone, Guardian 2 Name, Guardian 2 Email, Guardian 2 Phone
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">Please fix the following errors:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {students.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Student Number</TableHead>
                <TableHead>Guardian 1</TableHead>
                <TableHead>Guardian 2</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={index}>
                  {editingIndex === index ? (
                    <>
                      <TableCell>
                        <div className="space-y-2">
                          <Input
                            placeholder="First Name"
                            value={editForm?.firstName}
                            onChange={(e) => setEditForm({ ...editForm!, firstName: e.target.value })}
                          />
                          <Input
                            placeholder="Last Name"
                            value={editForm?.lastName}
                            onChange={(e) => setEditForm({ ...editForm!, lastName: e.target.value })}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.grade}
                          onChange={(e) => setEditForm({ ...editForm!, grade: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.studentNumber}
                          onChange={(e) => setEditForm({ ...editForm!, studentNumber: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.guardian1.name}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian1: { ...editForm!.guardian1, name: e.target.value }
                          })}
                          className="mb-2"
                          placeholder="Name"
                        />
                        <Input
                          value={editForm?.guardian1.email}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian1: { ...editForm!.guardian1, email: e.target.value }
                          })}
                          className="mb-2"
                          placeholder="Email"
                        />
                        <Input
                          value={editForm?.guardian1.phone1}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian1: { ...editForm!.guardian1, phone1: e.target.value }
                          })}
                          placeholder="Phone"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.guardian2?.name}
                          onChange={(e) => setEditForm({
                              ...editForm!,
                            /*@ts-ignore*/
                            guardian2: { ...editForm!.guardian2, name: e.target.value }
                        })}
                        className="mb-2"
                        placeholder="Name"
                        />
                        <Input
                          value={editForm?.guardian2?.email}
                          onChange={(e) => setEditForm({
                              ...editForm!,
                              /*@ts-ignore*/
                              guardian2: { ...editForm!.guardian2, email: e.target.value }
                            })}
                            className="mb-2"
                            placeholder="Email"
                            />
                        <Input
                          value={editForm?.guardian2?.phone1}
                          onChange={(e) => setEditForm({
                              ...editForm!,
                              /*@ts-ignore*/
                              guardian2: { ...editForm!.guardian2, phone1: e.target.value }
                            })}
                            placeholder="Phone"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-x-2">
                          <Button onClick={() => handleSaveEdit(index)} className="bg-[#00a58c]">
                            Save
                          </Button>
                          <Button onClick={() => setEditingIndex(null)} variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                      <>
                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.studentNumber}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p><>Name:</> {student.guardian1.name}</p>
                          <p><>Email:</> {student.guardian1.email}</p>
                          <p><>Phone:</> {student.guardian1.phone1}</p>
                          <p><>Phone2:</> {student.guardian1.phone2 ?? "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.guardian2 && (
                          <div className="space-y-1">
                            <p><>Name:</> {student.guardian2.name}</p>
                            <p><>Email:</> {student.guardian2.email}</p>
                            <p><>Phone1:</> {student.guardian2.phone1}</p>
                            <p><>Phone2:</> {student.guardian2.phone2 ?? "N/A"}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleEdit(index)} variant="outline">
                          Edit
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Submit button */}
      {students.length > 0 && (
        <div className="mt-6">
          <Button onClick={handleSubmitRoster} className="bg-[#00a58c]">
            Submit Student Roster
          </Button>
        </div>
      )}
    </div>
  );
}
