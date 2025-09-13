import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuestionBuilder } from '@/Section/School/component/question-builder'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createForm } from '@/api'
import { toast } from '@/hooks/use-toast'
import { GRADE_OPTIONS, Question, FormType } from '@/lib/types'
import { useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'


export default function FormBuilder() {
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<FormType>(FormType.AwardPoints)
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
  setFormType(FormType.AwardPoints)
  setQuestions([])
}

useEffect(()=>{
  switch(formType){
    case FormType.AwardPoints:
      setIsSendEmail({
        studentEmail: true,
        teacherEmail: true,
        schoolAdminEmail: false,
        parentEmail: false
      })
      break
    case FormType.DeductPoints:
      setIsSendEmail({
        studentEmail: true,
        teacherEmail: false,
        schoolAdminEmail: false,
        parentEmail: true
      })
      break
    case FormType.PointWithdraw:
      setIsSendEmail({
        studentEmail: true,
        teacherEmail: true,
        schoolAdminEmail: false,
        parentEmail: false
      })
      break
    case FormType.Feedback:
      setIsSendEmail({
        studentEmail: true,
        teacherEmail: true,
        schoolAdminEmail: true,
        parentEmail: false
      })
      break
    case FormType.AwardPointsIEP:
      setIsSendEmail({
        studentEmail: true,
        teacherEmail: true,
        schoolAdminEmail: false,
        parentEmail: false
      })
      break

  }
},[formType])

const navigate = useNavigate()

  const handleCreateForm = async () => {
    // Validation
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Form name is required', variant: 'destructive' });
      return;
    }
    if (questions.length === 0) {
      toast({ title: 'Error', description: 'At least one question is required', variant: 'destructive' });
      return;
    }
    // Ensure IEP questions have required fields, and remove for others
    const processedQuestions = questions.map(q => {
      if (formType === FormType.AwardPointsIEP) {
        return {
          ...q,
          goal: q.goal || '',
          goalSummary: q.goalSummary || '',
          targetedBehaviour: q.targetedBehaviour || '',
        };
      } else {
        // Remove IEP-only fields for other forms
        const { goal, goalSummary, targetedBehaviour, ...rest } = q;
        return rest;
      }
    });
    // Ensure grade is provided when isSpecial is false
    if (!isSpecial && !grade) {
      toast({ 
        title: 'Error', 
        description: 'Grade is required for non-special forms', 
        variant: 'destructive' 
      });
      return;
    }

    const response = await createForm(
      {
        formName, 
        formType, 
        questions: processedQuestions, 
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
                          'An error occurred while creating the form';
      toast({
        title: 'Error',
        description: errorMessage,
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
    // Ensure only valid type values are used
    const validTypes = ['text', 'select', 'number'];
    const type = validTypes.includes(question.type) ? question.type : 'text';
    setQuestions([...questions, { ...question, type }]);
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q))
  }

  const grades = GRADE_OPTIONS


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
            <SelectItem value={FormType.AwardPoints}>Award Points</SelectItem>
            <SelectItem value={FormType.Feedback}>Feedback</SelectItem>
            <SelectItem value={FormType.PointWithdraw}>Withdraw Points</SelectItem>
            <SelectItem value={FormType.DeductPoints}>Deduct Points</SelectItem>
            <SelectItem value={FormType.AwardPointsIEP}>Award Points with Individualized Education Plan (IEP)</SelectItem>
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
        maxPoints: 0
      })}>
        Add Question
      </Button>
      <Button className='w-full bg-[#00a58c] hover:bg-[#00a58c]' onClick={handleCreateForm}>Create Form</Button>
    </div>
  )
}