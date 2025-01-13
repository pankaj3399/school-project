import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AnswerType, Form, Question } from '@/lib/types'
import { getStudents } from '@/api'
import Modal from '@/Section/School/Modal'
import { Loader2 } from 'lucide-react'





type FormSubmissionProps = {
  form: Form
  isSubmitting:boolean
  onSubmit: (answers: AnswerType, submittedFor: string, isSendEmail: {
    studentEmail: boolean;
    teacherEmail: boolean;
    schoolAdminEmail: boolean;
    parentEmail: boolean;
  
}) => void
}

export function FormSubmission({ form, onSubmit, isSubmitting }: FormSubmissionProps) {
  const [submittedFor, setSubmittedFor] = useState("")
  const [answers, setAnswers] = useState<AnswerType>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [student, setStudent] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isSendEmail, setIsSendEmail] = useState({
    studentEmail: false,
    teacherEmail: false,
    schoolAdminEmail: false,
    parentEmail: false
  })
  const [description, setDescription] = useState("")

  const [totalPoints, setTotalPoints] = useState(0)

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
      .filter(q => q.isCompulsory)
      .every(q => {
        const answer = answers[q.id]
        return answer !== undefined && answer.answer !== '' && (Array.isArray(answer.answer) ? answer.answer.length > 0 : true)
      })
    setIsFormValid(allCompulsoryQuestionsAnswered)
  }, [answers, form.questions])

  useEffect(() => {
    const getStudent = async () => {
      const token = localStorage.getItem("token") || ""
      const response = await getStudents(token)
      setStudent(response.students)
    }
    getStudent()
  }, [])

  useEffect(()=>{
    switch(form.formType){
      case 'AwardPoints':
      case 'DeductPoints':{
        setDescription(`You will ${form.formType == 'AwardPoints' ? "AWARD":"REMOVE"} ${Math.abs(totalPoints)} POINTS TO ${student.find(item => item._id == submittedFor)?.name || "Unknown"}`)
      }
      break;
      case 'Feedback':{
        setDescription(`You will submit feedback about  ${student.find(item => item._id == submittedFor)?.name || "Unknown"}`)
      }
      break;
      default:{
        setDescription(`You will withdraw ${Math.abs(totalPoints)} POINTS`)
      }      
    }
  },[submittedFor])

  const handleInputChange = (questionId: string, value: {answer: string, points: number}) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onSubmit(answers, submittedFor, isSendEmail)
    setIsSendEmail((prev)=>prev)
    setShowModal(false)
  }

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={answers[question.id]?.answer as string || ''}
            onChange={(e) => handleInputChange(question.id, {answer: e.target.value, points: question.maxPoints})}
            required={question.isCompulsory}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={answers[question.id]?.answer as string || ''}
            onChange={(e) => handleInputChange(question.id, {answer: e.target.value, points: question.pointsType !== 'Deduct' ? parseInt(e.target.value) : parseInt(e.target.value) * -1})}
            required={question.isCompulsory}
            max={question.maxPoints}
            min={0}
          />
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
                points: question.pointsType !== 'Deduct' ? points : points * -1,
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
                  {option.value} {option.points ? <span className="text-muted-foreground">({question.pointsType === 'Award' ? '+' : '-'} {option.points} Points)</span> : ''}
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
          setShowModal(true)
        }} className="space-y-8 min-w-[300px] max-w-2xl mx-auto p-3 bg-white rounded-lg shadow-md">
          <div>
            <h1 className="text-2xl font-bold">{form.formName}</h1>
            <p className="text-muted-foreground">Form Type: {form.formType}</p>
          </div>
          <ScrollArea className="h-[43vh] pr-4">
            <div className="space-y-6 px-2">
              <div>
                <p>Student:</p>
                <Select value={submittedFor} onValueChange={(value) => setSubmittedFor(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {student && student.map((student: any) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {form.questions.map((question, index) => (
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
        {form.formType == 'DeductPoints' && submittedFor && <div>
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
