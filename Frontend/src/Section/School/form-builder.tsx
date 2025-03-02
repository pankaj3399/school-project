import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuestionBuilder } from '@/Section/School/component/question-builder'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createForm } from '@/api'
import { toast } from '@/hooks/use-toast'
import { Question } from '@/lib/types'
import { useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

type FormType = 'AwardPoints' | 'Feedback' | 'PointWithdraw' | 'DeductPoints'

export default function FormBuilder() {
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<FormType>('AwardPoints')
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSpecial, setIsSpecial] = useState(false)
const [grade, setGrade] = useState<string>("K")
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

const navigate = useNavigate()

  const handleCreateForm = async () => {
    console.log(JSON.stringify({formName, formType, questions}))
    const response = await createForm(
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
        description: 'Form Created Successfully'
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

  const getDefaultPointsType = (formType: FormType) => {
    switch(formType){
      case 'AwardPoints':
        return 'Award'
      case 'Feedback':
        return 'None'
      case 'PointWithdraw':
        return 'Deduct'
      case 'DeductPoints':
        return 'Deduct'
    }
  }

  const grades = [
    'K',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    'ADAPTIVE LEARNING ROOM',
    'ALTERNATIVE LEARNING CENTER',
    'AN CENTER',
    'ASD',
    'BEHAVIORAL ROOM',
    'GENERAL EDUCATION',
    'HOMEBOUND ROOM',
    'HOMEROOM',
    'LIFE SKILLS CLASSROOM',
    'PROGRAM #1',
    'PROGRAM #2',
    'PROGRAM #3',
    'RESOURCE ROOM',
    'SENSORY ROOM',
    'SPECIAL DAY CLASS',
    'SPECIALIZED ROOM',
    'THERAPEUTIC ROOM',
    'TRANSITION PROGRAM',
    'OTHER'
  ];


  return (
    <div className="max-w-4xl p-4 space-y-6 bg-white rounded-lg shadow-md mx-auto mt-12">
      <h1 className="text-2xl font-bold">Create Form</h1>
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
        <Select onValueChange={(value: FormType) => setFormType(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select form type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AwardPoints">Award Points</SelectItem>
            <SelectItem value="Feedback">Feedback</SelectItem>
            <SelectItem value="PointWithdraw">Point Withdraw</SelectItem>
            <SelectItem value="DeductPoints">Deduct Points</SelectItem>
            <SelectItem value="AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)">AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)</SelectItem>
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
      <Select value={grade.toString()} onValueChange={(value) => setGrade(value)}>
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
        pointsType: getDefaultPointsType(formType)
      })}>
        Add Question
      </Button>
      <Button className='w-full bg-[#00a58c] hover:bg-[#00a58c]' onClick={handleCreateForm}>Create Form</Button>
    </div>
  )
}