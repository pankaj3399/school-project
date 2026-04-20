import { Button } from "@/components/ui/button"
import EducationYearChart from "./component/new-chart"
import { useEffect, useState } from "react"
import { getCurrrentSchool, getStudents, sendReportImage } from "@/api"
import { useSchool } from "@/context/SchoolContext"
import { useAuth } from "@/authContext"
import { Role } from "@/enum"
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as htmlToImage from 'html-to-image'
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import ViewReport from "./view-report"
import Modal from "./Modal"

interface ReportResult {
  error?: string;
  success?: boolean;
  data?: unknown;
  [key: string]: unknown;
}

// Add these type declarations
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

// Add this component at the top of the file, before the Finalize component
const LoadingModal = ({ isOpen, progress }: { isOpen: boolean, progress: number }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-[50%] relative left-40">
        <h2 className="text-2xl font-bold mb-4 text-center">Generating Reports</h2>
        <Progress value={progress} className="w-full mb-4" />
        <p className="text-center text-gray-600">
        Thank you for your request. The Reports are being created. They will arrive soon.
          <br />
          Progress: {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};

const Finalize = () => {
  const [studentId, setStudentId] = useState<string>("")
  const [__, setStudents] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [schoolData, setSchoolData] = useState<any>({})
  const [selectedStudentsData, setSelectedStudentsData] = useState<SelectedStudentData>([])
  const [progress, setProgress] = useState(0)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [_, setGeneratedPDFs] = useState<{ fileName: string, pdf: jsPDF, toTeacher: string }[]>([])
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const { selectedSchoolId } = useSchool()
  const { user: authUser } = useAuth()

  const waitForChartReady = (expectedStudentId: string, timeoutMs = 5000, intervalMs = 50) =>
    new Promise<void>((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        const chart = document.getElementById('graph')
        const matchesStudent = chart?.getAttribute('data-student-id') === expectedStudentId
        const hasRenderedShape = !!chart?.querySelector('svg path, svg rect, svg line')
        if (matchesStudent && hasRenderedShape) return resolve()
        if (Date.now() - start >= timeoutMs) {
          return reject(new Error('Chart did not render in time for the selected student.'))
        }
        setTimeout(check, intervalMs)
      }
      check()
    })

  // Reset student selection when school changes
  useEffect(() => {
    setSelectedStudents(new Set());
    setSelectedStudentsData([]);
    setStudentId("");
  }, [selectedSchoolId]);

  const generateRewardPDF = async (student: any) => {
    const barChart = document.getElementById('graph')
    if (!barChart) {
      throw new Error(`Chart element not found; cannot generate report for ${student.studentInfo?.name || 'student'}.`);
    }

    const teacher = Array.isArray(student.teacher) && student.teacher.length > 0 ? student.teacher[0] : null;
    if (!teacher) {
      throw new Error(`No teacher assigned for ${student.studentInfo?.name || 'student'}; cannot send report.`);
    }
    if (!teacher.email) {
      throw new Error(`Teacher for ${student.studentInfo?.name || 'student'} has no email on file.`);
    }

    const src = await htmlToImage.toJpeg(barChart, { quality: 0.8 })
    const formdata = new FormData();
    const imageBlob = await (await fetch(src)).blob();
    formdata.append('file', imageBlob, 'chart.png');
    formdata.append('studentData', JSON.stringify(student));
    formdata.append('schoolData', JSON.stringify({ school: schoolData }));
    formdata.append('teacherData', JSON.stringify(teacher));

    const result = (await sendReportImage(formdata, teacher.email)) as ReportResult;
    if (result.error) {
      throw new Error(result.error);
    }
  }

  const generateAllReports = async () => {
    setIsGenerating(true)
    setProgress(0)
    setGeneratedPDFs([])
    setShowModal(false)

    let successCount = 0;
    const failures: string[] = [];

    try {
      for (let i = 0; i < selectedStudentsData.length; i++) {
        const current = selectedStudentsData[i];
        setStudentId(current.studentInfo._id)

        try {
          await waitForChartReady(current.studentInfo._id)
          await generateRewardPDF(current)
          successCount += 1;
        } catch (err: any) {
          console.error('Error sending report for student:', current.studentInfo?.name, err);
          failures.push(`${current.studentInfo?.name || 'Unknown'}: ${err?.message || 'Failed to send'}`);
        }

        setProgress(((i + 1) / selectedStudentsData.length) * 100)
      }

      if (successCount > 0 && failures.length === 0) {
        toast({
          title: "Success",
          description: `Generated ${successCount} report${successCount === 1 ? '' : 's'} successfully`,
        })
      } else if (successCount > 0) {
        toast({
          title: "Partial success",
          description: `${successCount} sent, ${failures.length} failed. First error: ${failures[0]}`,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: failures[0] || "Failed to send reports",
          variant: "destructive"
        })
      }
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }
   
  



 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        
        const isAdmin = authUser?.role === Role.SystemAdmin || authUser?.role === Role.Admin;
        if (isAdmin && !selectedSchoolId) {
          setStudents([])
          setSchoolData({})
          return;
        }

        const resTeacher = await getStudents(token ?? "", selectedSchoolId || undefined)
        const school = await getCurrrentSchool(token ?? "", selectedSchoolId || undefined)

        if (resTeacher.error) {
           throw new Error(resTeacher.error);
        }

        setStudents(resTeacher.students || [])
        setSchoolData(school.school || {})
      } catch (error: any) {
        console.error("Error fetching finalize data:", error);
        
        let message = error.message || "Failed to fetch necessary data for reporting.";
        const status = error?.response?.status;
        
        if (status === 404) {
          message = "The requested school or data was not found. Please ensure a school is selected.";
        } else if (status === 403) {
          message = "Access denied. You do not have permission to view this school's reports.";
        }

        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        setStudents([]);
        setSchoolData(null);
        setSelectedStudentsData([]);
      }
    }
    fetchData()
  }, [selectedSchoolId, authUser, toast])

  return (
    <div className="flex flex-col justify-center min-h-[80vh] gap-8">
      <h1 className="text-4xl font-bold text-center">
        Print Reports for Current School Year
      </h1>
      
      <div className="grid grid-cols-4 gap-4 w-full">
        <div className="col-span-4">
          <p>*Note: After you click on the button EMAIL REPORTS, each student's report is emailed to their assigned teacher. Please allow a few moments so we can build the reports.</p>
        </div>

        

        <Button 
          className="bg-[#00a58c] hover:bg-[#00a58c] text-md col-span-1"
          onClick={() => setShowModal(true)}
          disabled={isGenerating || selectedStudentsData.length === 0}
        >
          {isGenerating ? 'GENERATING...' : `EMAIL REPORTS (${selectedStudentsData.length})`}
        </Button>

        <Button
          variant="destructive"
          className=" text-md col-span-1"
          disabled={isGenerating || selectedStudentsData.length === 0}
          onClick={() => {
            setSelectedStudentsData([])
            setSelectedStudents(new Set())
          }}
        >
          Cancel
        </Button>
      </div>

      <div>
        <ViewReport 
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
          setSelectedStudentsData={setSelectedStudentsData}
          selectedStudentsData={selectedStudentsData}
        />
      </div>
      <div className="opacity-0">
        <EducationYearChart slimLines studentId={studentId} schoolId={selectedSchoolId || undefined} />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => generateAllReports()}
        title="Email Reports"
        description={`You are about to email ${selectedStudentsData.length} report${selectedStudentsData.length === 1 ? '' : 's'} to each student's assigned teacher. Are you sure you want to proceed?`}
        callToAction='Confirm'
        confirmDisabled={isGenerating}
      />

      <LoadingModal isOpen={isGenerating} progress={progress} />
    </div>
  )
}

export default Finalize