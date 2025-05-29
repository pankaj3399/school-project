import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { getReportDataStudentCombined } from '@/api';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { GRADE_OPTIONS } from '@/lib/types';

type ReportData = {
  gradeData: {
    grade: string;
    students: {
      student: {
        _id: string;
        name: string;
        grade: string;
        points: number;
        email?: string;
        parentEmail?: string;
      };
      feedback:any[];
      history: any[];
      totalPoints: {
        eToken: number;
        oopsies: number;
        withdraw: number;
      };
    }[];
    teachers: {
      _id: string;
      name: string;
      subject: string;
      type: string;
      grade: string;
    }[];
    totalStudents: number;
  }[];
};

type SelectedStudentData = {
  data: any[];
  feedback: any[];
  totalPoints: {
    eToken: number;
    oopsies: number;
    withdraw: number;
  };
  teacher: any[];
  studentInfo: {
    _id: string; // Added id to help with removal
    name: string;
    grade: string;
    email?: string;
    parentEmail?: string;
    standard?: string;
  };
}[];

export default function ViewReport({
    selectedStudentsData,
    setSelectedStudentsData,
    selectedStudents,
    setSelectedStudents,
}:{
    selectedStudentsData: SelectedStudentData,
    setSelectedStudentsData: Dispatch<SetStateAction<SelectedStudentData>>; 
    selectedStudents: Set<string>;
    setSelectedStudents: Dispatch<SetStateAction<Set<string>>>;
}) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
 

  const grades = GRADE_OPTIONS

  const handleSelectStudent = (studentId: string, studentData: any, gradeInfo:any) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
        // Remove from selectedStudentsData array
        setSelectedStudentsData(prev => prev.filter(item => item.studentInfo._id !== studentId));
      } else {
        newSet.add(studentId);
        // Add to selectedStudentsData array
        setSelectedStudentsData(prev => [...prev, {
          data: studentData.history,
          feedback: studentData.feedback,
          totalPoints: studentData.totalPoints,
          teacher: gradeInfo.teachers,
          studentInfo: {
            _id: studentId,
            name: studentData.student.name,
            grade: studentData.student.grade,
            email: studentData.student.email,
            parentEmail: studentData.student.parentEmail,
            standard: studentData.student.standard
          }
        }]);
      }
      return newSet;
    });
  };

  const handleSelectAllForGrade = (gradeInfo: any, selected: boolean) => {
    const students = gradeInfo.students;
    
    if (selected) {
      // Add all students in grade
      const newSelectedStudents = new Set(selectedStudents);
      const newStudentsData = [...selectedStudentsData];
      
      students.forEach((studentData: any) => {
        if (!newSelectedStudents.has(studentData.student._id)) {
          newSelectedStudents.add(studentData.student._id);
          newStudentsData.push({
            data: studentData.history,
            feedback: studentData.feedback,
            totalPoints: studentData.totalPoints,
            teacher: gradeInfo.teachers,
            studentInfo: {
              _id: studentData.student._id,
              name: studentData.student.name,
              grade: studentData.student.grade,
              email: studentData.student.email,
              parentEmail: studentData.student.parentEmail
            }
          });
        }
      });

      setSelectedStudents(newSelectedStudents);
      setSelectedStudentsData(newStudentsData);
    } else {
      // Remove all students in grade
      setSelectedStudents(prev => {
        const newSet = new Set(prev);
        students.forEach((s: any) => newSet.delete(s.student._id));
        return newSet;
      });
      setSelectedStudentsData(prev => 
        prev.filter(item => !students.some((s: any) => s.student._id === item.studentInfo._id))
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Add all students from all grades
      const newSelectedStudents = new Set<string>();
      const newStudentsData: SelectedStudentData = [];
      
      reportData?.gradeData.forEach(gradeInfo => {
        if (gradeInfo.teachers.length > 0) {
          gradeInfo.students.forEach(studentData => {
            newSelectedStudents.add(studentData.student._id);
            newStudentsData.push({
              data: studentData.history,
              feedback: studentData.feedback,
              totalPoints: studentData.totalPoints,
              teacher: gradeInfo.teachers,
              studentInfo: {
                _id: studentData.student._id,
                name: studentData.student.name,
                grade: studentData.student.grade,
                email: studentData.student.email,
                parentEmail: studentData.student.parentEmail
              }
            });
          });
        }
      });

      setSelectedStudents(newSelectedStudents);
      setSelectedStudentsData(newStudentsData);
    } else {
      // Clear all selections
      setSelectedStudents(new Set());
      setSelectedStudentsData([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getReportDataStudentCombined(grades);
        setReportData(response);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-lg text-gray-600">Loading student reports...</p>
        <p className="text-sm text-gray-400">This may take a moment</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={selectedStudents.size > 0 && selectedStudents.size === reportData?.gradeData.reduce((acc, grade) => acc + grade.students.length, 0)}
            onCheckedChange={handleSelectAll}
          />
          <span className="font-medium">Select All Students</span>
        </div>
        <span className="text-sm text-gray-500">
          {selectedStudents.size} students selected
        </span>
      </div>

      

      {reportData?.gradeData && reportData?.gradeData.length > 0 && reportData?.gradeData.map((gradeInfo) => (
        gradeInfo.teachers.length > 0 ? (
          <div key={gradeInfo.grade} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Teacher Info Header */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Grade {gradeInfo.grade}  -  {gradeInfo.teachers[0].name} ({gradeInfo.teachers[0].subject})
                </h2>
            {gradeInfo.students.length > 0 && <Checkbox
                checked={gradeInfo.students.every((s:any) => selectedStudents.has(s.student._id))}
                onCheckedChange={(checked) => handleSelectAllForGrade(gradeInfo, !!checked)}
                className="ml-4"
            />}
              </div>
             
            </div>

            {/* Students Table */}
            {gradeInfo.students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Select</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Grade</th>
                      <th className="px-6 py-3">Student Email</th>
                      <th className="px-6 py-3">Parent Email</th>
                      <th className="px-6 py-3">Total Points</th>
                      <th className="px-6 py-3 text-green-600">eTokens</th>
                      <th className="px-6 py-3 text-red-600">Oopsies</th>
                      <th className="px-6 py-3 text-blue-600">Withdrawals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeInfo.students.map((studentData:any, index) => (
                      <tr key={index} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Checkbox
                            checked={selectedStudents.has(studentData.student._id)}
                            onCheckedChange={() => handleSelectStudent(
                              studentData.student._id,
                              studentData,
                              gradeInfo
                            )}
                            
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {studentData.student.name}
                        </td>
                        <td className="px-6 py-4">{studentData.student.grade}</td>
                        <td className="px-6 py-4">{studentData.student.email || 'N/A'}</td>
                        <td className="px-6 py-4">{studentData.student.parentEmail || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold">
                          {studentData.student.points}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-medium">
                          {studentData.totalPoints.eToken}
                        </td>
                        <td className="px-6 py-4 text-red-600 font-medium">
                          {Math.abs(studentData.totalPoints.oopsies)}
                        </td>
                        <td className="px-6 py-4 text-blue-600 font-medium">
                          {Math.abs(studentData.totalPoints.withdraw)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No students found for Grade {gradeInfo.grade}
              </div>
            )}
          </div>
        ) : null
      ))}
    </div>
  );
}