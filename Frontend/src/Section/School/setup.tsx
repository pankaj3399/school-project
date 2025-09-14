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
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import Loading from "../Loading";
import { teacherRoster } from "@/api";
import { Download } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { GRADE_OPTIONS } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Create a link element to download the existing template file
    const link = document.createElement("a");
    link.href = "/src/assets/teacher.xlsx";
    link.download = "teacher-roster-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

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
        const workbook = XLSX.read(data, { type: "binary" });
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
            email: row["Email"] || "",
            recieveMails:
              row["Receive Mails"] === true || row["Receive Mails"] === "true",
            // subject: row['Subject'] || '',
            type:
              row["Type of Teacher"] === "Lead Teacher" ? "Lead" : "Special",
            grade: row["Grade"] || "",
          };
        });

        setTeachers(transformedData);
        setValidationErrors([]);
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

  const validateTeacherData = (): boolean => {
    const errors: string[] = [];

    teachers.forEach((teacher, index) => {
      const identifier = teacher.email || `Row ${index + 1}`;

      // Check required email field
      if (!teacher.email || teacher.email.trim() === "") {
        errors.push(`Teacher ${identifier}: Email is required.`);
      } else if (!teacher.email.includes("@")) {
        errors.push(`Teacher ${identifier}: Email format is invalid.`);
      }

      // Check teacher type
      if (
        !teacher.type ||
        (teacher.type !== "Lead" && teacher.type !== "Special")
      ) {
        errors.push(
          `Teacher ${identifier}: Type of Teacher must be either 'Lead Teacher' or 'Special Teacher'.`,
        );
      }

      // Check grade requirement for Lead Teachers
      if (teacher.type === "Lead") {
        if (!teacher.grade || teacher.grade.trim() === "") {
          errors.push(
            `Teacher ${identifier}: Grade is required for Lead Teachers.`,
          );
        } else if (!GRADE_OPTIONS.includes(teacher.grade)) {
          errors.push(
            `Teacher ${identifier}: Grade must be one of the valid options (e.g., 'K', '1', '2', 'Case Manager #1', 'Program #1', etc.).`,
          );
        }
      }

      // Check receiveMails field
      if (teacher.recieveMails === undefined || teacher.recieveMails === null) {
        errors.push(
          `Teacher ${identifier}: Receive Mails field must be set to true or false.`,
        );
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitRoster = async () => {
    if (!validateTeacherData()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let formattedTeachers = teachers.map((teacher) => ({
        ...teacher,
        // dateOfBirth: new Date(teacher.dateOfBirth).toISOString(),
        // name: `${teacher.firstName} ${teacher.lastName}`,
        // firstName: undefined,
        // lastName: undefined,
      }));
      console.log(formattedTeachers);
      const response = await teacherRoster({ teachers: formattedTeachers });
      if (!response.success) throw new Error("Failed to submit roster");

      toast({
        title: "Success",
        description: "Teacher roster submitted successfully",
      });
      setTeachers([]);
      setValidationErrors([]);
    } catch (error) {
      console.log(error);
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
            <AccordionTrigger className="text-lg font-semibold text-black bg-white border-b">
              Teacher Roster Instructions
            </AccordionTrigger>
            <AccordionContent className="bg-white text-black border rounded-b p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">
                    Required Column Headers (exact match):
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      <b>Email</b> - Teacher's email address
                    </li>
                    <li>
                      <b>Receive Mails</b> - Email notification preference
                    </li>
                    <li>
                      <b>Type of Teacher</b> - Teacher role classification
                    </li>
                    <li>
                      <b>Grade</b> - Grade level assignment
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Field Requirements:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      <b>Email:</b> Required, must be valid format (e.g.,
                      teacher@school.com)
                    </li>
                    <li>
                      <b>Receive Mails:</b> Required, use <code>true</code> or{" "}
                      <code>false</code> (no quotes)
                    </li>
                    <li>
                      <b>Type of Teacher:</b> Required, use{" "}
                      <code>Lead Teacher</code> or <code>Special Teacher</code>{" "}
                      (exact text)
                    </li>
                    <li>
                      <b>Grade:</b> Required for Lead Teachers only, must be one
                      of: Regular grades (K-12), Case Managers (#1-#20),
                      Programs (#1-#20), or Centers (AN/ASD/SSN #1-#5)
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Valid Grade Examples:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Regular grades: <code>K</code>, <code>1</code>,{" "}
                      <code>5</code>, <code>12</code>
                    </li>
                    <li>
                      Case Managers: <code>Case Manager #1</code>,{" "}
                      <code>Case Manager #15</code>
                    </li>
                    <li>
                      Programs: <code>Program #1</code>,{" "}
                      <code>Program #10</code>
                    </li>
                    <li>
                      Centers: <code>AN Center #1</code>, <code>ASD #3</code>,{" "}
                      <code>SSN #5</code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Important Notes:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      All data can be edited after import before submission
                    </li>
                    <li>
                      Validation errors will be shown if required fields are
                      missing or invalid
                    </li>
                    <li>
                      Download the template for proper formatting examples
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">
            Please fix the following errors:
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

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
                          onChange={(e) =>
                            setEditForm({ ...editForm!, email: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          value={editForm?.recieveMails ? "true" : "false"}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm!,
                              recieveMails: e.target.value === "true",
                            })
                          }
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
                          onChange={(e) =>
                            setEditForm({
                              ...editForm!,
                              type: e.target.value as "Lead" | "Special",
                            })
                          }
                          className="w-full p-2 border rounded"
                        >
                          <option value="Lead">Leader/Lead Teacher</option>
                          <option value="Special">Team Member/Teacher</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {editForm?.type === "Lead" && (
                          <Select
                            value={editForm?.grade || ""}
                            onValueChange={(value) =>
                              setEditForm({ ...editForm!, grade: value })
                            }
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
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleSaveEdit(index)}
                            className="mr-2"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingIndex(null)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      {/* <TableCell>{teacher.firstName}</TableCell> */}
                      {/* <TableCell>{teacher.lastName}</TableCell> */}
                      {/* <TableCell>{new Date(teacher.dateOfBirth).toLocaleDateString()}</TableCell> */}
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>
                        {teacher.recieveMails ? "True" : "False"}
                      </TableCell>
                      {/* <TableCell>{teacher.subject}</TableCell> */}
                      <TableCell>
                        {teacher.type === "Lead"
                          ? "Leader/Lead Teacher"
                          : "Team Member/Teacher"}
                      </TableCell>
                      <TableCell>
                        {teacher.type === "Lead" ? teacher.grade : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEdit(index)}
                            variant="outline"
                          >
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
