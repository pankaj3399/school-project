import { Button } from "@/components/ui/button"
import EducationYearChart from "./component/new-chart"
import { useEffect, useState } from "react"
import { getCurrrentSchool, getReportDataStudent, getStudents, resetStudentRoster, sendReport } from "@/api"
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as htmlToImage from 'html-to-image'
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

// Add these type declarations
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: any) => void;
}

const Finalize = () => {
  const [studentId, setStudentId] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [schoolData, setSchoolData] = useState<any>({})
  const [progress, setProgress] = useState(0)
  const [resetting, setResetting] = useState(false)
  const [_, setGeneratedPDFs] = useState<{ fileName: string, pdf: jsPDF, toTeacher: string }[]>([])
  const { toast } = useToast()

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const generatePDF = async (student: any) => {
    const doc = new jsPDF() as jsPDFWithPlugin
    const studentData = await getReportDataStudent(student._id, student.grade)
    const margin = 20
    let yPos = margin

    // School Header
    doc.setFontSize(16)
    doc.text(`Name: ${schoolData.school.name}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`District: ${schoolData.school.district}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`Address: ${schoolData.school.address}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`Country: ${schoolData.school.country}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`State: ${schoolData.school.state}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 15
    doc.setFontSize(14)

    // Lead Teacher Info
    const leadTeacher = studentData.teacher[0]
    doc.text(`${leadTeacher?.name || "N/A"}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`Subject: ${leadTeacher?.subject || "N/A"}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 15

    // Date
    const date = new Date()
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric'
    })
    doc.text(formattedDate, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 15

    // Student Info
    doc.text(`${student.name}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`Grade: ${student.grade}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`Parent Email 1: ${student.parentEmail}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text(`Parent Email 2: ${student.parentEmail2 || 'N/A'}`, doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 15

    // Title
    doc.setFontSize(16)
    doc.text('E-TOKEN SYSTEM', doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 7
    doc.text('ANNUAL SUMMARY', doc.internal.pageSize.width/2, yPos, { align: 'center' })
    yPos += 15
    doc.setFontSize(12)

 

    // Points Graph
    const barChart = document.getElementById('graph')
    if (barChart) {
      const src = await htmlToImage.toPng(barChart)
      doc.text('Points Summary Graph', margin, yPos)
      yPos += 5
      doc.addImage(src, 'PNG', margin -20, yPos, 200, 100)
      yPos += 150
    }

       // Total Points Table
       doc.text('Total Points', margin, yPos)
      yPos += 5
      
      doc.setFontSize(16)
      doc.autoTable({
        startY: yPos,
        head: [['Total ETokens', 'Total Oopsies', 'Total Withdrawals']],
        body: [[
          studentData.totalPoints.eToken,
          studentData.totalPoints.oopsies,
          studentData.totalPoints.withdraw
        ]],
        theme: 'grid',
        headStyles: { fillColor: [0, 165, 140] },
        styles: { halign: 'center' }
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(12)
    // Point History Table
    const historyData = studentData.data.map((item: any) => [
      new Date(item.submittedAt).toLocaleDateString(),
      item.formType,
      item.points
    ])

    doc.text('Points History', margin, yPos)
      yPos += 5

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Action', 'Points']],
      body: historyData,
      theme: 'grid',
      headStyles: { fillColor: [0, 165, 140] },
      styles: { halign: 'center' }
    })
    yPos = (doc as any).lastAutoTable.finalY + 15

    // Feedback Table
    if (studentData.feedback.length > 0) {
      const feedbackData = studentData.feedback.map((item: any) => [
        new Date(item.createdAt).toLocaleDateString(),
        item.submittedByName,
        item.submittedBySubject,
        item.feedback
      ])

      doc.text('Feedbacks', margin, yPos)
      yPos += 5

      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Teacher Name', 'Subject', 'Feedback']],
        body: feedbackData,
        theme: 'grid',
        headStyles: { fillColor: [0, 165, 140] },
        columnStyles: {
          3: { cellWidth: 60 } // Make feedback column wider
        },
        styles: { 
          overflow: 'linebreak',
          cellPadding: 2
        }
      })
    }

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
    
    const pdfs = []
    for (let i = 0; i < students.length; i++) {
      // Update student ID and wait for chart to update
      setStudentId(students[i]._id)
      await delay(2000) // Wait for chart to update

      // Generate PDF
      const pdf = await generatePDF(students[i])
      if (pdf) pdfs.push(pdf)

      // Update progress
      setProgress(((i + 1) / students.length) * 100)
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
          if(teacherEmail)
             sendReport(formData, teacherEmail);
          
          // Save locally
          // pdf.pdf.save(pdf.fileName);
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


  const resetStudent = async ()=>{
      try{
        setResetting(true)
        await resetStudentRoster()
        setResetting(false)
        toast({
          title: "Success",
          description: `Student Roster Reset Successfully`,
        })
      }catch(e){
        console.log("Error",e);
      }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <h1 className="text-4xl font-bold text-center">
        Conclude the Current School Year
      </h1>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        {isGenerating && (
          <div className="w-full space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-gray-500">
              Generating reports... {Math.round(progress)}%
            </p>
          </div>
        )}

        <Button 
          className="bg-[#00a58c] hover:bg-[#00a58c] h-16 text-lg"
          onClick={generateAllReports}
          disabled={isGenerating || students.length === 0 || resetting}
        >
          {isGenerating ? 'Generating Reports...' : 'Generate Reports'}
        </Button>

        <Button 
          variant="destructive"
          className="h-16 text-lg"
          disabled={isGenerating || resetting}
          onClick={() => {
            resetStudent()
            console.log("Reset Student Roster clicked")
          }}
        >
          {
            resetting ? 'Resetting Students...' : 'Reset Students'
          }
        </Button>
      </div>

      <div className="opacity-0">
        <EducationYearChart slimLines studentId={studentId} />
      </div>
    </div>
  )
}

export default Finalize