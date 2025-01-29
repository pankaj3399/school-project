//f
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {  Form, FormType, Question } from '@/lib/types'
import { editForm, getFormById } from '@/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { QuestionBuilder } from '@/Section/School/component/question-builder'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'



export default function EditFormTeacher() {
  const params = useParams();
//   const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const [form, setForm] = useState<any | null>(null)
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState<FormType>('AwardPoints')
    const [questions, setQuestions] = useState<Question[]>([])
    const [isSpecial, setIsSpecial] = useState(false)
const [grade, setGrade] = useState<number>(1)
    const [isSendEmail, setIsSendEmail] = useState({
      studentEmail: false,
      teacherEmail: false,
      schoolAdminEmail: false,
      parentEmail: false
    })
  
  const clearForm = () => {
    setFormName('')
    setFormType('AwardPoints')
    setQuestions([])
  }

  const handleCreateForm = async () => {
      console.log(JSON.stringify({formName, formType, questions}))
      const response = await editForm(
        params?.id ?? "",
        {
          formName, 
          formType, 
          questions, 
          isSpecial,
          grade: isSpecial ? null : grade,
          ...isSendEmail
        },
        localStorage.getItem('token')!
      )
      if(response.error){
        toast({
          title: 'Error',
          description: response.error,
          variant: 'destructive'
        })   
      }else{
        toast({
          title: 'Success',
          description: 'Form Edited Successfully'
        })
        clearForm()
        navigate('/teachers/viewforms')
      }
    }
  
    const addQuestion = (question: Question) => {
      setQuestions([...questions, question])
    }
  
    const removeQuestion = (id: string) => {
      setQuestions(questions.filter(q => q.id !== id))
    }
  
    const updateQuestion = (updatedQuestion: Question) => {
      setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q))
    }

  const getForm = async (id: string): Promise<Form | null | OnErrorEventHandlerNonNull> => {
    const token = localStorage.getItem('token')
    if(token){
      const form = await getFormById(id, token)
      setForm(form.form as Form)
      return form.form as Form
    }
    return null
  }

  useEffect(() => {
    getForm(params?.id || "")
  },[])

  useEffect(()=>{
    if(!form) return

    setFormName(form.formName)
    setFormType(form.formType as FormType)
    setQuestions(form.questions)
    setIsSpecial(form.isSpecial || false)
    setGrade(form.grade || 1)
    setIsSendEmail({
      ...isSendEmail,
      studentEmail: !!form.studentEmail,
      teacherEmail: !!form.teacherEmail,
      schoolAdminEmail: !!form.schoolAdminEmail,
      parentEmail: !!form.parentEmail
    })
  },[form])


  const grades = Array.from({length: 6}, (_, i) => i + 1);
  

  if (!form) {
    return <div>Loading...</div>
  }

  

  return (
    <div className="max-w-4xl p-4 space-y-6 bg-white rounded-lg shadow-md mx-auto mt-12">
      <h1 className="text-2xl font-bold">Edit Form <span className='text-gray-400 italic text-sm'>({form.formName})</span></h1>
      <div>
            <Label htmlFor="formName">Form Name</Label>
            <Input
              id="formName"
              name="formName"
              value={formName}
              placeholder='Enter Form Name'
              onChange={(e)=>setFormName(e.target.value)}
              required
            />
      </div>

      <div>
        <label htmlFor="formType" className="block text-sm font-medium text-gray-700 mb-1">
          Select Form Type
        </label>
        <Select value={formType} defaultValue={formType} onValueChange={(value: FormType) => setFormType(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select form type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AwardPoints">Award Points</SelectItem>
            <SelectItem value="Feedback">Feedback</SelectItem>
            <SelectItem value="PointWithdraw">Point Withdraw</SelectItem>
            <SelectItem value="DeductPoints">Deduct Points</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
  

  {!isSpecial && (
    <div>
      <Label htmlFor="grade">Grade</Label>
      <Select disabled value={grade.toString()} onValueChange={(value) => setGrade(parseInt(value))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select grade" />
        </SelectTrigger>
        <SelectContent>
          {grades.map((g) => (
            <SelectItem key={g} value={g.toString()}>
              Grade {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )}
</div>
      <div className='flex gap-2 text-sm'>
            <div className="flex items-center space-x-2">
              <Checkbox checked={isSendEmail.studentEmail} onCheckedChange={() => setIsSendEmail(prev => ({...prev, studentEmail: !prev.studentEmail}))}/>
              <p>Notify Student</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={isSendEmail.teacherEmail} onCheckedChange={() => setIsSendEmail(prev => ({...prev, teacherEmail: !prev.teacherEmail}))}/>
              <p>Notify Teacher</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={isSendEmail.schoolAdminEmail} onCheckedChange={() => setIsSendEmail(prev => ({...prev, schoolAdminEmail: !prev.schoolAdminEmail}))}/>
              <p>Notify Admin</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={isSendEmail.parentEmail} onCheckedChange={() => setIsSendEmail(prev => ({...prev, parentEmail: !prev.parentEmail}))}/>
              <p>Notify Parents/Guardians</p>
            </div>
           
          </div>
      <div className="space-y-4">
        {questions.map((question, index) => (
          <>
          <p className='text-sm text-muted-foreground'>Question {index + 1}</p>
          <QuestionBuilder
            formType={formType}
            key={question.id}
            question={question}
            onUpdate={updateQuestion}
            onRemove={removeQuestion}
            />
          </>
        ))}
      </div>
      <Button
      variant='outline'
       onClick={() => addQuestion({
        id: Date.now().toString(),
        text: '',
        type: 'text',
        isCompulsory: false,
        maxPoints: 0,
        pointsType: 'Award'
      })}>
        Add Question
      </Button>
      <Button className='w-full bg-[#00a58c] hover:bg-[#00a58c]' onClick={handleCreateForm}>Save Form</Button>
    </div>
  )
}
