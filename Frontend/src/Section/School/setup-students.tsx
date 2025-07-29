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
import { GRADE_OPTIONS } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentData {
  firstName: string;
  lastName: string;
  grade: string;
  studentNumber: string;
  guardian1: {
    name: string;
    email: string;
  };
  guardian2: {
    name: string;
    email: string;
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
    // Create sample data for the template using valid GRADE_OPTIONS
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Grade': '5',
        'Student Number': '2024001',
        'Guardian 1 Name': 'Jane Doe',
        'Guardian 1 Email': 'jane.doe@email.com',
        'Guardian 2 Name': 'Mike Doe',
        'Guardian 2 Email': 'mike.doe@email.com'
      },
      {
        'First Name': 'Sarah',
        'Last Name': 'Smith',
        'Grade': '3',
        'Student Number': '2024002',
        'Guardian 1 Name': 'Mary Smith',
        'Guardian 1 Email': 'mary.smith@email.com',
        'Guardian 2 Name': '',
        'Guardian 2 Email': ''
      },
      {
        'First Name': 'Alex',
        'Last Name': 'Johnson',
        'Grade': 'Case Manager #1',
        'Student Number': '2024003',
        'Guardian 1 Name': 'Robert Johnson',
        'Guardian 1 Email': 'robert.johnson@email.com',
        'Guardian 2 Name': 'Lisa Johnson',
        'Guardian 2 Email': 'lisa.johnson@email.com'
      },
      {
        'First Name': 'Emily',
        'Last Name': 'Davis',
        'Grade': 'K',
        'Student Number': '2024004',
        'Guardian 1 Name': 'Jennifer Davis',
        'Guardian 1 Email': 'jennifer.davis@email.com',
        'Guardian 2 Name': 'Christopher Davis',
        'Guardian 2 Email': 'chris.davis@email.com'
      },
      {
        'First Name': 'Michael',
        'Last Name': 'Wilson',
        'Grade': '12',
        'Student Number': '2024005',
        'Guardian 1 Name': 'Patricia Wilson',
        'Guardian 1 Email': 'patricia.wilson@email.com',
        'Guardian 2 Name': '',
        'Guardian 2 Email': ''
      },
      {
        'First Name': 'Sofia',
        'Last Name': 'Garcia',
        'Grade': 'Program #5',
        'Student Number': '2024006',
        'Guardian 1 Name': 'Carlos Garcia',
        'Guardian 1 Email': 'carlos.garcia@email.com',
        'Guardian 2 Name': 'Isabella Garcia',
        'Guardian 2 Email': 'isabella.garcia@email.com'
      },
      {
        'First Name': 'Ethan',
        'Last Name': 'Brown',
        'Grade': '8',
        'Student Number': '2024007',
        'Guardian 1 Name': 'Amanda Brown',
        'Guardian 1 Email': 'amanda.brown@email.com',
        'Guardian 2 Name': '',
        'Guardian 2 Email': ''
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
          };

          // Check if Guardian 2 data exists
          let guardian2 = null;
          if (row['Guardian 2 Name'] || row['Guardian 2 Email']) {
            guardian2 = {
              name: row['Guardian 2 Name'] || '',
              email: row['Guardian 2 Email'] || '',
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
      
      // Check required student fields
      if (!student.firstName || !student.lastName) {
        errors.push(`Student ${identifier}: First Name and Last Name are required.`);
      }
      
      if (!student.grade || student.grade.trim() === '') {
        errors.push(`Student ${identifier}: Grade is required.`);
      } else if (!GRADE_OPTIONS.includes(student.grade)) {
        errors.push(`Student ${identifier}: Grade must be one of the valid options (e.g., 'K', '1', '2', 'Case Manager #1', 'Program #1', etc.).`);
      }
      
      if (!student.studentNumber || student.studentNumber.trim() === '') {
        errors.push(`Student ${identifier}: Student Number is required.`);
      }
      
      // Check Guardian 1 data completeness
      const g1 = student.guardian1;
      if (!g1.name || !g1.email) {
        errors.push(`Student ${identifier}: Missing required Guardian 1 information (${!g1.name ? 'name' : ''}${!g1.email ? ', email' : ''}).`);
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
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Required Column Headers (exact match):</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><b>First Name</b> - Student's first name</li>
                    <li><b>Last Name</b> - Student's last name</li>
                    <li><b>Grade</b> - Student's grade level</li>
                    <li><b>Student Number</b> - Unique student identifier</li>
                    <li><b>Guardian 1 Name</b> - Primary guardian's name</li>
                    <li><b>Guardian 1 Email</b> - Primary guardian's email</li>
                    <li><b>Guardian 2 Name</b> - Secondary guardian's name (optional)</li>
                    <li><b>Guardian 2 Email</b> - Secondary guardian's email (optional)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Field Requirements:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><b>First Name & Last Name:</b> Required for all students</li>
                    <li><b>Grade:</b> Required, must be one of: Regular grades (K-12), Case Managers (#1-#20), Programs (#1-#20), or Centers (AN/ASD/SSN #1-#5)</li>
                    <li><b>Student Number:</b> Required, unique identifier</li>
                    <li><b>Guardian 1 Name, Email:</b> Required for all students</li>
                    <li><b>Guardian 2 fields:</b> All optional, leave empty if not applicable</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Valid Grade Examples:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Regular grades: <code>K</code>, <code>1</code>, <code>5</code>, <code>12</code></li>
                    <li>Case Managers: <code>Case Manager #1</code>, <code>Case Manager #15</code></li>
                    <li>Programs: <code>Program #1</code>, <code>Program #10</code></li>
                    <li>Centers: <code>AN Center #1</code>, <code>ASD #3</code>, <code>SSN #5</code></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Important Notes:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Email addresses must be in valid format (e.g., user@domain.com)</li>
                    <li>All data can be edited after import before submission</li>
                    <li>Validation errors will be shown if required fields are missing or invalid</li>
                    <li>Download the template for proper formatting examples</li>
                  </ul>
                </div>
              </div>
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
                        <Select
                          value={editForm?.grade || ''}
                          onValueChange={(value) => setEditForm({ ...editForm!, grade: value })}
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
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm?.guardian2?.name || ''}
                          onChange={(e) => setEditForm({
                            ...editForm!,
                            guardian2: { 
                              ...(editForm!.guardian2 || { name: '', email: '' }), 
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
                              ...(editForm!.guardian2 || { name: '', email: '' }), 
                              email: e.target.value 
                            }
                          })}
                          className="mb-2"
                          placeholder="Email (optional)"
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
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.guardian2 && (
                          <div className="space-y-1">
                            <p><span className="font-semibold">Name:</span> {student.guardian2.name}</p>
                            <p><span className="font-semibold">Email:</span> {student.guardian2.email}</p>
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
