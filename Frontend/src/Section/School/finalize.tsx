import { Button } from "@/components/ui/button"
import EducationYearChart from "./component/new-chart"
import { useEffect, useState } from "react"
import { getCurrrentSchool, getStudents, sendReport } from "@/api"
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as htmlToImage from 'html-to-image'
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import ViewReport from "./view-report"
import Modal from "./Modal"

// Add these type declarations
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: any) => void;
}
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
          Reports are in the process of creation. The reports are on their way to your email. They will arrive soon!
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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const generatePDF = async (student: any) => {
    const doc = new jsPDF() as jsPDFWithPlugin
    
    // Add footer to all pages
    const totalPages = 2; // We know we have 2 pages
    const addFooter = (pageNumber: number) => {
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      
      // Format date
      const today = new Date()
      const dateStr = today.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      })

      // Add footer elements
      doc.text(`Page ${pageNumber} of ${totalPages}`, 20, pageHeight - 10)
      doc.text("THE RADU FRAMEWORK", pageWidth/2, pageHeight - 10, { align: 'center' })
      doc.text(`Created On ${dateStr}`, pageWidth - 20, pageHeight - 10, { align: 'right' })
    }

    const studentData = selectedStudentsData.find((data) => data.studentInfo._id == student._id) || 
      { data: [], feedback: [], totalPoints: { eToken: 0, oopsies: 0, withdraw: 0 }, teacher: [], studentInfo: student }
    console.log("Student Data", selectedStudentsData, student._id);
    
    
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    let yPos = margin

    // Add Radu Framework logo on left
    const raduLogo = '/radu-logo.png'
    doc.addImage(raduLogo, 'PNG', margin, yPos-15, 40, 60)

    // Add School logo on right if exists
    if (schoolData.school.logo) {
      // Convert Cloudinary URL to base64
      try {
        const response = await fetch(schoolData.school.logo);
        const blob = await response.blob();
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const base64Image = reader.result as string;
        doc.addImage(base64Image, 'PNG', pageWidth - margin - 40, yPos, 40, 40);
      } catch (error) {
        console.error('Error loading school logo:', error);
      }
    }

    // Center heading between logos
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    const centerX = pageWidth / 2

    // Get teacher's last name
    const teacherLastName = studentData.teacher[0]?.name.split(" ").pop() || "N/A"

    // Add centered headings
    yPos += 10
    doc.text("THE RADU FRAMEWORK", centerX, yPos, { align: 'center' })
    yPos += 8
    doc.text("E-TOKEN SYSTEM", centerX, yPos, { align: 'center' })
    yPos += 8
    doc.text(schoolData.school.name, centerX, yPos, { align: 'center' })
    yPos += 8
    doc.text(teacherLastName, centerX, yPos, { align: 'center' })
    yPos += 8
    doc.text(`Grade - ${studentData.teacher[0]?.grade}` || "N/A", centerX, yPos, { align: 'center' })
    
    // Reset font settings
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    
    yPos += 25 // Increased spacing for new section

    // Add large student name heading
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text(student.name.toUpperCase(), centerX, yPos, { align: 'center' })
    
    // Add date line
    yPos += 10
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })
    doc.text(`As of ${dateStr}`, centerX, yPos, { align: 'center' })
    
    yPos += 20 // Space before continuing with rest of content
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    // Points Graph
    const barChart = document.getElementById('graph')
    if (barChart) {
      const src = await htmlToImage.toPng(barChart)
      doc.addImage(src, 'PNG', margin -20, yPos, 200, 100)
      yPos += 120 // Increased spacing after graph
    }

    doc.autoTable({
      startY: yPos,
      head: [['E-Tokens', 'Oopsies', 'Withdrawals', 'Balance', 'Feedback']],
      body: [[
        studentData.totalPoints.eToken,
        Math.abs(studentData.totalPoints.oopsies),
        Math.abs(studentData.totalPoints.withdraw),
        student.balance || 0,
        studentData.feedback.length
      ]],
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0], // Black text
        fontSize: 12,
        fontStyle: 'bold',
        cellPadding: 8,
        halign: 'center',
        lineWidth: 0.5, // Add border width
        lineColor: [0, 0, 0] // Black borders
      },
      bodyStyles: {
        fontSize: 12,
        halign: 'center',
        lineWidth: 0.5, // Add border width
        lineColor: [0, 0, 0] // Black borders
      },
      styles: {
        cellPadding: 6,
        fontSize: 12,
        cellWidth: 'auto'
      },
      tableWidth: 'auto',
      margin: { left: margin },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { fontStyle: 'bold' },
        2: { fontStyle: 'bold' },
        3: { fontStyle: 'bold' },
        4: { fontStyle: 'bold' }
      }
    })
    yPos = (doc as any).lastAutoTable.finalY + 40

    // Add footer to first page before adding new page
    addFooter(1)

    // Start a new page for history and feedback
    doc.addPage()
    yPos = margin

    // Point History Table
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text('History', margin, yPos)
    yPos += 10

    const historyData = studentData.data.map((item: any) => {
      const date = new Date(item.submittedAt)
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        item.submittedForName,
        item.formType,
        item.points.toString()
      ]
    })

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Time', 'Student', 'Action', 'Points']],
      body: historyData,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
        cellPadding: 4,
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        cellPadding: 3
      },
      styles: {
        overflow: 'linebreak',
        minCellHeight: 6
      },
      columnStyles: {
        0: { cellWidth: 25 },     // Date column
        1: { cellWidth: 20 },     // Time column
        2: { cellWidth: 35 },     // Student column
        3: { cellWidth: 'auto' }, // Action column
        4: { cellWidth: 15, halign: 'right' }  // Points column
      }
    })

    yPos = (doc as any).lastAutoTable.finalY + 30

    // Feedback Table
    if (studentData.feedback.length > 0) {
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text('Feedback', margin, yPos)
      yPos += 10

      const feedbackData = studentData.feedback.map((item: any) => {
        const date = new Date(item.createdAt)
        return [
          date.toLocaleDateString(),
          item.submittedByName,
          item.feedback
        ]
      })

      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Teacher', 'Feedback']],
        body: feedbackData,
        theme: 'grid',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontSize: 12,
          fontStyle: 'bold',
          cellPadding: 8,
          halign: 'center',
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        },
        bodyStyles: {
          fontSize: 10,
          lineWidth: 0.5,
          lineColor: [0, 0, 0]
        },
        styles: {
          cellPadding: 6,
          fontSize: 10,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 100 }  // Fixed width for feedback column
        }
      })
    }

    // Add footer to second page at the end
    addFooter(2)

    return {
      fileName: `${student.name}_report.pdf`,
      pdf: doc,
      toTeacher: studentData.teacher[0]?.email
    }
  }

  const generateAllReports = async () => {
    setIsGenerating(true)
    setProgress(0)
    setGeneratedPDFs([])
    setShowModal(false)
    
    const pdfs = []
    for (let i = 0; i < selectedStudentsData.length; i++) {
      // Update student ID and wait for chart to update
      setStudentId(selectedStudentsData[i].studentInfo._id)
      await delay(2000) // Wait for chart to update

      // Generate PDF
      const pdf = await generatePDF(selectedStudentsData[i].studentInfo)
      if (pdf) pdfs.push(pdf)

      // Update progress
      setProgress(((i + 1) / selectedStudentsData.length) * 100)
    }

  
    setGeneratedPDFs(pdfs)
    const pdfsByTeacher = pdfs.reduce((acc: { [key: string]: { fileName: string, pdf: jsPDF, toTeacher: string }[] }, pdf) => {
      if (!acc[pdf.toTeacher]) {
        acc[pdf.toTeacher] = [];
      }
      acc[pdf.toTeacher].push(pdf);
      return acc;
    }, {});    

    for (const [teacherEmail, teacherPdfs] of Object.entries(pdfsByTeacher)) {
      for (const pdf of teacherPdfs as { fileName: string, pdf: jsPDF, toTeacher: string }[]) {
        try {
          // Convert jsPDF to blob with proper type
          const pdfBlob = new Blob([pdf.pdf.output('blob')], { type: 'application/pdf' });
          
          // Create FormData and append file with correct field name
          const formData = new FormData();
          formData.append('file', pdfBlob, pdf.fileName);
    
          // Send the report
          if(teacherEmail){
            sendReport(formData, teacherEmail);
            // pdf.pdf.save(pdf.fileName);
          }
          
          await delay(500);
        } catch (error) {
          console.error('Error sending report:', error);
          toast({
            title: "Error",
            description: `Failed to send report to ${teacherEmail}`,
            variant: "destructive"
          });
        }
      }
    }
    setIsGenerating(false)
    setProgress(0)
    
    toast({
      title: "Success",
      description: `Generated ${pdfs.length} reports successfully`,
    })
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
        description={`You are about to email ${selectedStudentsData.length} reports to your email. Are you sure you want to proceed?`}
        callToAction='Confirm'
      />

      <LoadingModal isOpen={isGenerating} progress={progress} />
    </div>
  )
}

export default Finalize