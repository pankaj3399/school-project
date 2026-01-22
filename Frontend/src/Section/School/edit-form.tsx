import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, FormType, GRADE_OPTIONS, Question } from '@/lib/types'
import { editForm, getFormById, getStudents } from '@/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { QuestionBuilder } from './component/question-builder'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X } from 'lucide-react'

export default function EditForm() {
  const params = useParams();
  const navigate = useNavigate()
  const [form, setForm] = useState<any | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<FormType>(FormType.AwardPoints)
  const [isSpecial, setIsSpecial] = useState(false)
  const [grade, setGrade] = useState<string>("K")
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSendEmail, setIsSendEmail] = useState({
    studentEmail: false,
    teacherEmail: false,
    schoolAdminEmail: false,
    parentEmail: false
  })
  // Student pre-selection for IEP forms
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [isStudentPopoverOpen, setIsStudentPopoverOpen] = useState(false)

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
        ...(formType === FormType.AwardPointsIEP && { preSelectedStudents: selectedStudents }),
        ...isSendEmail
      },
      localStorage.getItem('token')!
    )
    if (response.error) {
      // Extract error message from the error object
      const errorMessage = response.error?.response?.data?.message ||
        response.error?.message ||
        'An error occurred while editing the form';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } else {
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
    if (token) {
      const form = await getFormById(id, token)
      setForm(form.form as Form)
      return form.form as Form
    }
    return null
  }

  useEffect(() => {
    getForm(params?.id || "")
    // Fetch students for IEP pre-selection
    const fetchStudents = async () => {
      const token = localStorage.getItem('token')
      const resStudents = await getStudents(token ?? "")
      setStudents(resStudents.students)
      setFilteredStudents(resStudents.students)
    }
    fetchStudents()
  }, [])

  useEffect(() => {
    if (!form) return

    setFormName(form.formName)
    setFormType(form.formType as FormType)
    setQuestions(form.questions)
    setIsSpecial(form.isSpecial || false)
    setGrade(form.grade || "K")
    setSelectedStudents(form.preSelectedStudents || [])
    setIsSendEmail({
      ...isSendEmail,
      studentEmail: !!form.studentEmail,
      teacherEmail: !!form.teacherEmail,
      schoolAdminEmail: !!form.schoolAdminEmail,
      parentEmail: !!form.parentEmail
    })
  }, [form])

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
          onChange={(e) => setFormName(e.target.value)}
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

      {/* Student Pre-selection for IEP forms */}
      {formType === FormType.AwardPointsIEP && (
        <div>
          <Label>Assign to Students (IEP)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select specific students who should have access to this IEP form
          </p>
          <Popover open={isStudentPopoverOpen} onOpenChange={setIsStudentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedStudents.length > 0
                  ? `${selectedStudents.length} student(s) selected`
                  : "Select students..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 flex flex-col space-y-0">
              <Input
                onChange={(e) => {
                  const value = e.target.value;
                  setFilteredStudents(
                    students.filter((s: any) =>
                      s.name.toLowerCase().includes(value.toLowerCase())
                    )
                  );
                }}
                className="w-full"
                placeholder="Search students..."
              />
              <div className="flex flex-col h-[300px] overflow-y-auto">
                {filteredStudents.map((student: any) => (
                  <Button
                    key={student._id}
                    onClick={() => {
                      if (selectedStudents.includes(student._id)) {
                        setSelectedStudents(prev => prev.filter(id => id !== student._id));
                      } else {
                        setSelectedStudents(prev => [...prev, student._id]);
                      }
                    }}
                    className={`justify-start ${selectedStudents.includes(student._id)
                        ? 'bg-blue-100 hover:bg-blue-200'
                        : ''
                      }`}
                    variant={"ghost"}
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student._id)}
                      className="mr-2"
                    />
                    {student.name} ({student.grade})
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {selectedStudents.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Selected Students:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedStudents.map(studentId => {
                  const student = students.find(s => s._id === studentId);
                  return student ? (
                    <div key={studentId} className="flex items-center bg-blue-100 rounded-md px-2 py-1 text-sm">
                      <span>{student.name}</span>
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => setSelectedStudents(prev => prev.filter(id => id !== studentId))}
                      />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
            <Select value={grade} onValueChange={(value) => setGrade(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
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
          <Checkbox checked={isSendEmail.studentEmail} onCheckedChange={() => setIsSendEmail(prev => ({ ...prev, studentEmail: !prev.studentEmail }))} />
          <p>Notify Student</p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={isSendEmail.teacherEmail} onCheckedChange={() => setIsSendEmail(prev => ({ ...prev, teacherEmail: !prev.teacherEmail }))} />
          <p>Notify Teacher</p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={isSendEmail.schoolAdminEmail} onCheckedChange={() => setIsSendEmail(prev => ({ ...prev, schoolAdminEmail: !prev.schoolAdminEmail }))} />
          <p>Notify Admin</p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={isSendEmail.parentEmail} onCheckedChange={() => setIsSendEmail(prev => ({ ...prev, parentEmail: !prev.parentEmail }))} />
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