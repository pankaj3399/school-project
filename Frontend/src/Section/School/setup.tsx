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
import { Download } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface TeacherData {
  // firstName: string;
  // lastName: string;
  // dateOfBirth: string;
  email: string;
  // subject: string;
  type: "Lead" | "Special";
  grade?: string;
  recieveMails?: boolean; // Added to support Excel upload and UI
}

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TeacherData | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Create sample data for the template
    const templateData = [
      {
        'Email': 'john.doe@school.com',
        'Receive Mails': true,
        'Type of Teacher': 'Lead Teacher',
        'Grade': '5th Grade'
      },
      {
        'Email': 'jane.smith@school.com',
        'Receive Mails': false,
        'Type of Teacher': 'Special Teacher',
        'Grade': ''
      },
      {
        'Email': 'mike.johnson@school.com',
        'Receive Mails': true,
        'Type of Teacher': 'Lead Teacher',
        'Grade': '3rd Grade'
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teacher Roster Template');

    // Generate and download the file
    XLSX.writeFile(workbook, 'teacher-roster-template.xlsx');

    toast({
      title: "Template Downloaded",
      description: "Teacher roster template has been downloaded successfully",
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

        // Validate and transform the data
        const transformedData: TeacherData[] = jsonData.map((row: any) => {
          // Convert Excel date number to actual date
          // let dob = row['Date of Birth'];
          // if (typeof dob === 'number') {
          //   // Convert Excel date number to JavaScript date
          //   dob = new Date((dob - 25569) * 86400 * 1000).toISOString().split('T')[0];
          // }

          return {
            // firstName: row['First Name'] || '',
            // lastName: row['Last Name'] || '',
            // dateOfBirth: dob || '',
            email: row['Email'] || '',
            recieveMails: row['Receive Mails'] === true || row['Receive Mails'] === 'true',
            // subject: row['Subject'] || '',
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
        // dateOfBirth: new Date(teacher.dateOfBirth).toISOString(),
        // name: `${teacher.firstName} ${teacher.lastName}`,
        // firstName: undefined,
        // lastName: undefined,
      }))
      console.log(formattedTeachers)
      const response = await teacherRoster({teachers: formattedTeachers});
      if (!response.success) throw new Error('Failed to submit roster');

      toast({
        title: "Success",
        description: "Teacher roster submitted successfully",
      });
      setTeachers([]);
    } catch (error) {
      console.log(error)
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

  // Add delete handler function
  const handleDelete = (index: number) => {
    const newTeachers = [...teachers];
    newTeachers.splice(index, 1);
    setTeachers(newTeachers);
    toast({
      title: "Teacher Removed",
      description: "Teacher has been removed from the roster",
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Teacher Roster Setup</h1>
      
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
            <AccordionTrigger className="text-lg font-semibold text-black bg-white border-b">Teacher Roster Instructions</AccordionTrigger>
            <AccordionContent className="bg-white text-black border rounded-b p-4">
              <ul className="list-disc pl-5 space-y-1">
                <li>Column headers must match exactly: <b>Email</b>, <b>Receive Mails</b>, <b>Type of Teacher</b>, <b>Grade</b></li>
                <li><b>Email:</b> Teacher's email address (required)</li>
                <li><b>Receive Mails:</b> Enter <code>true</code> or <code>false</code> (without quotes) to enable/disable email notifications</li>
                <li><b>Type of Teacher:</b> Enter <code>Lead Teacher</code> or <code>Special Teacher</code> (exact text required)</li>
                <li><b>Grade:</b> Required for Lead Teachers (e.g., "5th Grade", "3rd Grade"), leave empty for Special Teachers</li>
                <li>You can edit any imported data before submitting</li>
                <li>For <b>Receive Mails</b> field: use <code>true</code> or <code>false</code> (boolean values)</li>
                <li>For <b>Type of Teacher</b> field: use <code>Lead Teacher</code> or <code>Special Teacher</code> (exact text)</li>
                <li>Grade field is optional for Special Teachers but required for Lead Teachers</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {teachers.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>First Name</TableHead> */}
                {/* <TableHead>Last Name</TableHead> */}
                {/* <TableHead>Date of Birth</TableHead> */}
                <TableHead>Email</TableHead>
                <TableHead>Receive Mails</TableHead>
                {/* <TableHead>Subject</TableHead> */}
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
                      {/* <TableCell>
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
                      </TableCell> */}
                      {/* <TableCell>
                        <Input
                          type="date"
                          value={editForm?.dateOfBirth}
                          onChange={(e) => setEditForm({ ...editForm!, dateOfBirth: e.target.value })}
                        />
                      </TableCell> */}
                      <TableCell>
                        <Input
                          value={editForm?.email}
                          onChange={(e) => setEditForm({ ...editForm!, email: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          value={editForm?.recieveMails ? 'true' : 'false'}
                          onChange={(e) => setEditForm({ ...editForm!, recieveMails: e.target.value === 'true' })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      </TableCell>
                      {/* <TableCell>
                        <Input
                          value={editForm?.subject}
                          onChange={(e) => setEditForm({ ...editForm!, subject: e.target.value })}
                        />
                      </TableCell> */}
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
                        <div className="flex space-x-2">
                          <Button onClick={() => handleSaveEdit(index)} className="mr-2">Save</Button>
                          <Button onClick={() => setEditingIndex(null)} variant="outline">Cancel</Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      {/* <TableCell>{teacher.firstName}</TableCell> */}
                      {/* <TableCell>{teacher.lastName}</TableCell> */}
                      {/* <TableCell>{new Date(teacher.dateOfBirth).toLocaleDateString()}</TableCell> */}
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.recieveMails ? 'True' : 'False'}</TableCell>
                      {/* <TableCell>{teacher.subject}</TableCell> */}
                      <TableCell>{teacher.type === 'Lead' ? 'Leader/Lead Teacher' : 'Team Member/Teacher'}</TableCell>
                      <TableCell>{teacher.type === 'Lead' ? teacher.grade : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button onClick={() => handleEdit(index)} variant="outline">Edit</Button>
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
