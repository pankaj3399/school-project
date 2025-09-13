import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {  Form, FormType, GRADE_OPTIONS, Question } from '@/lib/types'
import { editForm, getFormById } from '@/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { QuestionBuilder } from './component/question-builder'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from "@/components/ui/switch"

export default function EditForm() {
  const params = useParams();
  const navigate = useNavigate()
  const [form, setForm] = useState<any | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<FormType>(FormType.AwardPoints)
  const [isSpecial, setIsSpecial] = useState(false)
  const [grade, setGrade] = useState<number>(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSendEmail, setIsSendEmail] = useState({
    studentEmail: false,
    teacherEmail: false,
    schoolAdminEmail: false,
    parentEmail: false
  })

  const clearForm = () => {
    setFormName('')
    setFormType(FormType.AwardPoints)
    setQuestions([])
  }

  const handleCreateForm = async () => {
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
      // Extract error message from the error object
      const errorMessage = response.error?.response?.data?.message || 
                          response.error?.message || 
                          'An error occurred while editing the form';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })   
    }else{
      toast({
        title: 'Success',
        description: 'Form Edited Successfully'
      })
      clearForm()
      navigate('/viewforms')
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

  const grades = GRADE_OPTIONS

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
            <SelectItem value={FormType.AwardPoints}>Award Points</SelectItem>
            <SelectItem value={FormType.Feedback}>Feedback</SelectItem>
            <SelectItem value={FormType.PointWithdraw}>Withdraw Points</SelectItem>
            <SelectItem value={FormType.DeductPoints}>Deduct Points</SelectItem>
            <SelectItem value={FormType.AwardPointsIEP}>
            Award Points with Individualized Education Plan (IEP)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="isSpecial">Special Teacher Form</Label>
          <Switch
            id="isSpecial"
            checked={isSpecial}
            onCheckedChange={setIsSpecial}
          />
        </div>

        {!isSpecial && (
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select value={grade.toString()} onValueChange={(value) => setGrade(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g.toString()}>
                    {g}
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
          maxPoints: formType === FormType.AwardPointsIEP ? 1 : 0,
          goal: formType === FormType.AwardPointsIEP ? '' : undefined,
          goalSummary: formType === FormType.AwardPointsIEP ? '' : undefined,
          targetedBehaviour: formType === FormType.AwardPointsIEP ? '' : undefined
        })}>
        Add Question
      </Button>

      <Button className='w-full bg-[#00a58c] hover:bg-[#00a58c]' onClick={handleCreateForm}>Save Form</Button>
    </div>
  )
}