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
import { Download } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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

export default function SetupStudents() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<StudentData | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Create sample data for the template
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Grade': '5th Grade',
        'Student Number': '2024001',
        'Guardian 1 Name': 'Jane Doe',
        'Guardian 1 Email': 'jane.doe@email.com',
        'Guardian 1 Phone': '+1234567890',
        'Guardian 1 Phone 2': '+1234567891',
        'Guardian 2 Name': 'Mike Doe',
        'Guardian 2 Email': 'mike.doe@email.com',
        'Guardian 2 Phone': '+1234567892',
        'Guardian 2 Phone 2': '+1234567893'
      },
      {
        'First Name': 'Sarah',
        'Last Name': 'Smith',
        'Grade': '3rd Grade',
        'Student Number': '2024002',
        'Guardian 1 Name': 'Mary Smith',
        'Guardian 1 Email': 'mary.smith@email.com',
        'Guardian 1 Phone': '+1234567894',
        'Guardian 1 Phone 2': '',
        'Guardian 2 Name': '',
        'Guardian 2 Email': '',
        'Guardian 2 Phone': '',
        'Guardian 2 Phone 2': ''
      },
      {
        'First Name': 'Alex',
        'Last Name': 'Johnson',
        'Grade': '7th Grade',
        'Student Number': '2024003',
        'Guardian 1 Name': 'Robert Johnson',
        'Guardian 1 Email': 'robert.johnson@email.com',
        'Guardian 1 Phone': '+1234567895',
        'Guardian 1 Phone 2': '',
        'Guardian 2 Name': 'Lisa Johnson',
        'Guardian 2 Email': 'lisa.johnson@email.com',
        'Guardian 2 Phone': '+1234567896',
        'Guardian 2 Phone 2': ''
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Roster Template');

    // Generate and download the file
    XLSX.writeFile(workbook, 'student-roster-template.xlsx');

    toast({
      title: "Template Downloaded",
      description: "Student roster template has been downloaded successfully",
    });
  };

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

        setStudents(transformedData);
        setValidationErrors([]);
        
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

  // Add delete handler function
  const handleDelete = (index: number) => {
    const newStudents = [...students];
    newStudents.splice(index, 1);
    setStudents(newStudents);
    toast({
      title: "Student Removed",
      description: "Student has been removed from the roster",
    });
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
        email: student.studentNumber+ "@school.com",
        parentEmail: student.guardian1.email,
        standard: student.grade,
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
      setValidationErrors([]);
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
        <div className="flex items-center gap-4 mb-4">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="flex-1"
          />
          <Button 
            onClick={downloadTemplate} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>
        <Accordion type="single" collapsible defaultValue="instructions">
          <AccordionItem value="instructions">
            <AccordionTrigger className="text-lg font-semibold text-black bg-white border-b">Student Roster Instructions</AccordionTrigger>
            <AccordionContent className="bg-white text-black border rounded-b p-4">
              <ul className="list-disc pl-5 space-y-1">
                <li>Column headers must match exactly: <b>First Name</b>, <b>Last Name</b>, <b>Grade</b>, <b>Student Number</b>, <b>Guardian 1 Name</b>, <b>Guardian 1 Email</b>, <b>Guardian 1 Phone</b>, <b>Guardian 1 Phone 2</b>, <b>Guardian 2 Name</b>, <b>Guardian 2 Email</b>, <b>Guardian 2 Phone</b>, <b>Guardian 2 Phone 2</b></li>
                <li><b>First Name</b> and <b>Last Name</b>: Student's names (required)</li>
                <li><b>Grade</b>: Student's grade level (required)</li>
                <li><b>Student Number</b>: Unique student identifier (required)</li>
                <li><b>Guardian 1 Name, Email, Phone</b>: Required for all students</li>
                <li><b>Guardian 1 Phone 2</b>: Optional</li>
                <li><b>Guardian 2 Name, Email, Phone, Phone 2</b>: Optional, leave empty if not applicable</li>
                <li>Email addresses must be in valid format (e.g., user@domain.com)</li>
                <li>Phone numbers can include country codes and formatting</li>
                <li>You can edit any imported data before submitting</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
                          className="mb-2"
                        />
                        <Input
                          value={editForm?.guardian1.phone2 || ''}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian1: { ...editForm!.guardian1, phone2: e.target.value }
                          })}
                          placeholder="Phone 2 (optional)"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.guardian2?.name || ''}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian2: { 
                              ...(editForm!.guardian2 || { name: '', email: '', phone1: '' }), 
                              name: e.target.value 
                            }
                          })}
                          className="mb-2"
                          placeholder="Name (optional)"
                        />
                        <Input
                          value={editForm?.guardian2?.email || ''}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian2: { 
                              ...(editForm!.guardian2 || { name: '', email: '', phone1: '' }), 
                              email: e.target.value 
                            }
                          })}
                          className="mb-2"
                          placeholder="Email (optional)"
                        />
                        <Input
                          value={editForm?.guardian2?.phone1 || ''}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian2: { 
                              ...(editForm!.guardian2 || { name: '', email: '', phone1: '' }), 
                              phone1: e.target.value 
                            }
                          })}
                          placeholder="Phone (optional)"
                          className="mb-2"
                        />
                        <Input
                          value={editForm?.guardian2?.phone2 || ''}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian2: { 
                              ...(editForm!.guardian2 || { name: '', email: '', phone1: '', phone2: '' }), 
                              phone2: e.target.value 
                            }
                          })}
                          placeholder="Phone 2 (optional)"
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
                          <p><span className="font-semibold">Name:</span> {student.guardian1.name}</p>
                          <p><span className="font-semibold">Email:</span> {student.guardian1.email}</p>
                          <p><span className="font-semibold">Phone:</span> {student.guardian1.phone1}</p>
                          {student.guardian1.phone2 && (
                            <p><span className="font-semibold">Phone 2:</span> {student.guardian1.phone2}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.guardian2 && (
                          <div className="space-y-1">
                            <p><span className="font-semibold">Name:</span> {student.guardian2.name}</p>
                            <p><span className="font-semibold">Email:</span> {student.guardian2.email}</p>
                            <p><span className="font-semibold">Phone:</span> {student.guardian2.phone1}</p>
                            {student.guardian2.phone2 && (
                              <p><span className="font-semibold">Phone 2:</span> {student.guardian2.phone2}</p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button onClick={() => handleEdit(index)} variant="outline">
                            Edit
                          </Button>
                          <Button 
                            onClick={() => handleDelete(index)} 
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
