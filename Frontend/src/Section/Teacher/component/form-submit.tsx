import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AnswerType, Question } from '@/lib/types'
import { getStudents } from '@/api'
import Modal from '@/Section/School/Modal'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/authContext'
import { timezoneManager } from '@/lib/luxon'

type FormSubmissionProps = {
  form: any
  isSubmitting:boolean
  onSubmit: (answers: AnswerType, submittedFor: string, isSendEmail: {
    studentEmail: boolean;
    teacherEmail: boolean;
    schoolAdminEmail: boolean;
    parentEmail: boolean;
  
}, submittedAt:Date, isManuallySet: boolean) => void
}

export function FormSubmission({ form, onSubmit, isSubmitting }: FormSubmissionProps) {
  const {user} = useAuth()
  const [submittedFor, setSubmittedFor] = useState("")
  const [answers, setAnswers] = useState<AnswerType>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [filteredStudent, setfilteredStudent] = useState<any[]>([])
  const [isPopOverOpen, setIsPopOverOpen] = useState(false)
  const [grade, setGrade] = useState("All")
  const [student, setStudent] = useState<any[]>([])
  const [isSendEmail, setIsSendEmail] = useState({
    studentEmail: false,
    teacherEmail: false,
    schoolAdminEmail: false,
    parentEmail: false
  })
  const [description, setDescription] = useState("")

  const [totalPoints, setTotalPoints] = useState(0)
  const [submittedAt, setSubmittedAt] = useState(() => {
    // Initialize with current date in school's timezone
    if (user?.schoolId?.timeZone) {
      const schoolCurrentTime = timezoneManager.getSchoolCurrentTime(user.schoolId.timeZone);
      return schoolCurrentTime.toJSDate();
    }
    return new Date();
  });

  const [isManuallySet, setIsManuallySet] = useState(false)

  useEffect(()=>{
    let ansarr = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: answer.answer,
      points: answer.points
    }))
    setTotalPoints(ansarr.reduce((acc, curr) => acc + curr.points, 0))
  },[answers])

  useEffect(() => {
    const allCompulsoryQuestionsAnswered = form.questions
      .filter((q:any) => q.isCompulsory)
      .every((q:any) => {
        const answer = answers[q.id]
        return answer !== undefined && answer.answer !== '' && (Array.isArray(answer.answer) ? answer.answer.length > 0 : true)
      })
      const isInvalid = student.find(st => st._id == submittedFor)?.points + totalPoints < 0
  
      setIsFormValid(allCompulsoryQuestionsAnswered && !isInvalid && !!submittedFor)
  }, [answers,totalPoints, form.questions, submittedFor])

  useEffect(() => {
    const getStudent = async () => {
      const token = localStorage.getItem("token") || ""
      const response = await getStudents(token)
      if(form ){
        if(form.isSpecial || user?.type == 'Special'){

          setStudent(response.students.map((s: any) => ({
            ...s,
            name:s.name + " - Grade " + s.grade
          })))
          setfilteredStudent(response.students.map((s: any) => ({
            ...s,
            name:s.name + " - Grade " + s.grade
          })))
        }else{
          setStudent(response.students.map((s: any) => ({
            ...s,
            name:s.name + " - Grade " + s.grade
          })))
          setfilteredStudent(response.students.map((s: any) => ({
            ...s,
            name:s.name + " - Grade " + s.grade
          })))
        }
      }else{
        
        setStudent(response.students.filter((s: any) => s.grade === form.grade))
        setfilteredStudent(response.students.filter((s: any) => s.grade === form.grade))
      }
    }
    getStudent()
  }, [])

  useEffect(()=>{
    if(grade == "All"){
      setfilteredStudent(student.filter((s: any) => s))
    }else{
      setfilteredStudent(student.filter((s: any) => s.grade == grade))
    }
  },[grade])

  useEffect(()=>{
    switch(form.formType){
      case 'AwardPoints':
      case 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)':
      case 'DeductPoints':{
        setDescription(`You will ${form.formType == 'AwardPoints' || form.formType == 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)' ? "Award":"Deduct"} ${Math.abs(totalPoints)} points ${form.formType == 'AwardPoints' || form.formType == 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)' ? "to":"from"} ${student.find(item => item._id == submittedFor)?.name || "Unknown"}.`)
      }
      break;
      case 'Feedback':{
        setDescription(`You will submit feedback about  ${student.find(item => item._id == submittedFor)?.name || "Unknown"}.`)
      }
      break;
      default:{
        setDescription(`You will withdraw ${Math.abs(totalPoints)} POINTS from ${student.find(item => item._id == submittedFor)?.name || "Unknown"}'s Account.`)
      }      
    }
  },[submittedFor, totalPoints])

  const handleInputChange = (questionId: string, value: {answer: string, points: number}) => {
    
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    onSubmit(answers, submittedFor, isSendEmail, submittedAt, isManuallySet)
    setIsSendEmail((prev)=>prev)
    setShowModal(false)
  }

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'text':
        return form.formType != 'Feedback' ? (
          (<>
            <div className='space-y-2 my-1 text-xs'>
              {question.goal && <p className="font-semibold text-gray-900">Goal: {question.goal}</p>}
              {question.goalSummary && <p className="font-semibold text-gray-900">Goal Summary: {question.goalSummary}</p>}
              {question.targetedBehaviour && <p className="font-semibold text-gray-900">Targeted Behaviour: {question.targetedBehaviour}</p>}
              {question.otherGoal && <p className="font-semibold text-gray-900">Other Goal: {question.otherGoal}</p>}
            </div>
            <Input
            type= {form.formType == 'Feedback' ? 'text' : 'number'}
            value={answers[question.id]?.answer as string || ''}
            max={question.maxPoints}
            min={0}
            onChange={(e) => {
              const points =  isNaN(Number(e.target.value)) ? 0: Number(e.target.value)              
              if(points > question.maxPoints){
                e.target.setCustomValidity(`Value must be less than or equal to ${question.maxPoints}`)
              }else{
                e.target.setCustomValidity('')
              }
              e.target.reportValidity()
              handleInputChange(question.id, {answer: e.target.value, points: question.pointsType === 'Deduct' ? points*-1:points})
            }}
            required={question.isCompulsory}
          />
          </>)
        ) : (
          <>
          <div>
              {question.goal && <p className="text-muted-foreground">Goal: {question.goal}</p>}
              {question.goalSummary && <p className="text-muted-foreground">Goal Summary: {question.goalSummary}</p>}
              {question.targetedBehaviour && <p className="text-muted-foreground">Targeted Behaviour: {question.targetedBehaviour}</p>}
              {question.otherGoal && <p className="text-muted-foreground">Other Goal: {question.otherGoal}</p>}
            </div>
          <Textarea
            value={answers[question.id]?.answer as string || ''}
            onChange={(e) => {
              const points =  isNaN(Number(e.target.value)) ? 0: Number(e.target.value)
              if(points > question.maxPoints){
                e.target.setCustomValidity(`Value must be less than or equal to ${question.maxPoints}`)
              }else{
                e.target.setCustomValidity('')
              }
              e.target.reportValidity()
              handleInputChange(question.id, {answer: e.target.value, points})
            }}
            required={question.isCompulsory}
          />
          </>
        )
      
      case 'number':
        return (
          <>
            <div className='space-y-2 my-1 text-xs'>
              {question.goal && <p className="font-semibold border p-1 rounded-md text-gray-500">Goal: {question.goal}</p>}
              {question.goalSummary && <p className="font-semibold border p-1 rounded-md text-gray-500">Goal Summary: {question.goalSummary}</p>}
              {question.targetedBehaviour && <p className="font-semibold border p-1 rounded-md text-gray-500">Targeted Behaviour: {question.targetedBehaviour}</p>}
              {question.otherGoal && <p className="font-semibold border p-1 rounded-md text-gray-500">Other Goal: {question.otherGoal}</p>}
            </div>
            <Input
            type="number"
            value={answers[question.id]?.answer as string || ''}
            onChange={(e) => {
                
              if(isNaN(Number(e.target.value))){
                handleInputChange(question.id, {answer: e.target.value, points: 0})
              }else{
                handleInputChange(question.id, {answer: e.target.value, points: question.pointsType === 'Deduct' ? Number(e.target.value)*-1:Number(e.target.value)})
              }
            }}
            required={question.isCompulsory}
            max={ question.maxPoints}
            min={0}
          />
          </>
        )
      
      case 'select':
        
        return (
          <Select
            value={answers[question.id]?.answer as string || ''}
            onValueChange={(value) => {
              const selectedOption = question.options?.find(o => o.value === value);
              const points = selectedOption ? selectedOption.points : 0;
              handleInputChange(question.id, {
                answer: value,
                points: question.pointsType === 'Deduct' ? points*-1:points
              });
            }}
            required={question.isCompulsory}
          > 
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.value} {option.points ? <span className="text-muted-foreground">( {option.points} Points)</span> : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return null
    }
  }

  return (
    <>
    <div className='flex'>
        <form onSubmit={(e)=> {
          e.preventDefault()
          const form = e.target as HTMLFormElement
          const ip = form.querySelectorAll('input')
          ip.forEach(i => i.reportValidity())
          setShowModal(true)
        }} className="space-y-8 min-w-[300px] max-w-2xl mx-auto p-3 bg-white rounded-lg shadow-md">
          <div>
            <h1 className="text-2xl font-bold">{form.formName}</h1>
            <p className="text-muted-foreground">Form Type: {form.formType}</p>
          </div>
          <ScrollArea className="h-[43vh] pr-4">
            <div className="space-y-6 px-2">
              {
                form && form.isSpecial && <div>
                <p>Grade:</p>
                <Select onValueChange={(value)=>setGrade(value)} value={grade}>
                  <SelectTrigger>
                    <SelectValue defaultValue={grade} placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {[...new Set(student.map((s: any) => s.grade))].map((grade) => (
                      <SelectItem key={grade} value={grade?.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              }

              <div>
                <p>Date:</p>
                <Input 
                  type="date" 
                  required 
                  value={
                    user?.schoolId?.timeZone 
                      ? timezoneManager.formatForInput(submittedAt, user.schoolId.timeZone)
                      : submittedAt.toISOString().split('T')[0]
                  }
                  onChange={(e) => {
                   const selectedDate = e.target.valueAsDate;
                            
                   if(selectedDate) {
                      setIsManuallySet(true)
                      selectedDate.setHours(12, 0, 0, 0);
                      setSubmittedAt(selectedDate);
                    }
                  }}
                />
                {user?.schoolId?.timeZone && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Time zone: {user.schoolId.timeZone} 
                    ({timezoneManager.formatForSchool(submittedAt, user.schoolId.timeZone, 'ZZZZ')})
                  </p>
                )}
              </div>
              <div>
                <p>Student:</p>
                {Array.isArray(student) && student.length > 0 ? (
  <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        className="w-full justify-between"
      >
        {submittedFor
          ? student.find((s: any) => s._id === submittedFor)?.name
          : "Select student..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[320px] p-0 flex flex-col space-y-0">
          <Input onChange={(e)=>{
            const value = e.target.value
            if(value == ""){
              setfilteredStudent(student.filter((s: any) => s.grade == parseInt(grade)))
            }else{
              setfilteredStudent(filteredStudent.filter((s: any) => s.name.toLowerCase().includes(value.toLowerCase())))
            }
          }} />
          <div className="flex flex-col h-[200px] overflow-y-auto">
          {
            filteredStudent.map((s: any) => (
              <Button onClick={()=>{ setSubmittedFor(s._id)

                setIsPopOverOpen(false)
              }} key={s._id} className='justify-start' variant={"ghost"}>{s.name}</Button>
            ))
          }
          </div>
    </PopoverContent>
  </Popover>
) : (
  <div className='font-bold'>No students available for this Grade</div>
)}
              </div>
              
              {form.questions.map((question:any, index:number) => (
                <div key={question.id} className="border-b pb-4 ">
                  
                  <h3 className="font-medium mb-2">
                    {index + 1}. {question.text} {
                      question.type === 'select' || question.pointsType === 'None' ? <span className="text-muted-foreground"></span> : <span className="text-muted-foreground">(Upto {question.maxPoints} Points)</span>
                    }
                    {
                      question.pointsType === 'Award' ? <span className="text-green-500 ml-1">Award</span> : question.pointsType === 'Deduct' ? <span className="text-red-500 ml-1">Deduct</span> : ''
                    }
                    {question.isCompulsory && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {renderQuestion(question)}
                  <div>
                  </div>
                  <div>
                </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button type="submit" disabled={!isFormValid}>{
            isSubmitting ?  <Loader2 className='w-3 h-3 animate-spin' />:"Submit"  
          }</Button>
        </form>
        {(form.formType == 'DeductPoints' || form.formType == 'PointWithdraw') && submittedFor && <div>
          <div className='bg-white p-4 border'>
            <h6 className='text-xl font-semibold'>Available Points</h6>
            <p className='text-3xl font-semibold text-green-500'>{student.find(item => item._id == submittedFor)?.points || "Unknown"}</p>
          </div>
        </div>}
    </div>
    <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => handleSubmit()}
        title="Submit Form"
        description={description}
        callToAction='Submit'
      />
    </>
  )
}