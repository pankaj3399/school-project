import { Button } from "@/components/ui/button"
import EducationYearChart from "./component/new-chart"
import { useEffect, useState } from "react"
import { getCurrentUser, getCurrrentSchool, getStudents, sendReportImage } from "@/api"
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as htmlToImage from 'html-to-image'
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import ViewReport from "./view-report"
import Modal from "./Modal"

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
  const [resetting, setResetting] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [_, setGeneratedPDFs] = useState<{ fileName: string, pdf: jsPDF, toTeacher: string }[]>([])
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [user, setUser] = useState<any>({})
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  useEffect(()=>{
    const getUserData = async () => {
      const token = localStorage.getItem("token")
      const user = await getCurrentUser(token ?? "")
      
      setUser(user.user)
    }

    getUserData()
  },[])

  const generateRewardPDF = async (student: any) => {
    const barChart = document.getElementById('graph')
    if (barChart) {
      const src = await htmlToImage.toPng(barChart)
      const formdata = new FormData();
      // Convert image data URL to Blob
      const imageBlob = await (await fetch(src)).blob();
      formdata.append('file', imageBlob, 'chart.png');
      
      // Stringify objects before appending
      formdata.append('studentData', JSON.stringify(student));
      formdata.append('schoolData', JSON.stringify(schoolData));
      formdata.append('teacherData', JSON.stringify(student.teacher[0]));
      
      await sendReportImage(formdata, student.teacher[0].email || "");
    }
    
  }

  const generateAllReports = async () => {
    setIsGenerating(true)
    setProgress(0)
    setGeneratedPDFs([])
    setShowModal(false)
  
    try {
      for (let i = 0; i < selectedStudentsData.length; i++) {
        // Update student ID and wait for chart to update
        setStudentId(selectedStudentsData[i].studentInfo._id)
        await delay(2000) // Wait for chart to update
  
        // Generate PDF
        await generateRewardPDF(selectedStudentsData[i])
        setProgress(((i + 1) / selectedStudentsData.length) * 100)
      }
      setIsGenerating(false)
      setProgress(0)
      toast({
        title: "Success",
        description: `Generated ${selectedStudentsData.length} reports successfully`,
      })
    } catch (error) {
      console.error('Error sending report:', error);
      toast({
        title: "Error",
        description: `Failed to send reports`,
        variant: "destructive"
      });
    }
   }
   
  



 

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token")
      const resTeacher = await getStudents(token ?? "")
      const school = await getCurrrentSchool(token ?? "")      
      setStudents(resTeacher.students)
      setSchoolData(school)
    }
    fetchData()
  }, [])

  return (
    <div className="flex flex-col justify-center min-h-[80vh] gap-8">
      <h1 className="text-4xl font-bold text-center">
        Print Reports for Current School Year
      </h1>
      
      <div className="grid grid-cols-4 gap-4 w-full">
        <div className="col-span-4">
          <p>*Note: After you click on the button EMAIL REPORTS, you will receive an individual report per student in your email. Please allow a few moments so we can build the reports</p>
        </div>

        

        <Button 
          className="bg-[#00a58c] hover:bg-[#00a58c] text-md col-span-1"
          onClick={() => setShowModal(true)}
          disabled={isGenerating || selectedStudentsData.length === 0 || resetting}
        >
          {isGenerating ? 'GENERATING...' : `EMAIL REPORTS (${selectedStudentsData.length})`}
        </Button>

        <Button 
          variant="destructive"
          className=" text-md col-span-1"
          disabled={isGenerating || resetting}
          onClick={() => {
            setResetting(true)
           setSelectedStudentsData([])
            setSelectedStudents(new Set())
            setResetting(false)
          }}
        >
          {
            resetting ? 'Cancelling..' : 'Cancel'
          }
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
        <EducationYearChart slimLines studentId={studentId} />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => generateAllReports()}
        title="Email Reports"
        description={`You are about to email ${selectedStudentsData.length} reports to ${user.email || "your email"}. Are you sure you want to proceed?`}
        callToAction='Confirm'
      />

      <LoadingModal isOpen={isGenerating} progress={progress} />
    </div>
  )
}

export default Finalize