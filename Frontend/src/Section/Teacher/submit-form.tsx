import { useState } from 'react'
import { FormSubmission } from '@/Section/Teacher/component/form-submit'
import { useNavigate, useParams } from 'react-router-dom'
import { AnswerType, Form } from '@/lib/types'
import { getFormById, submitFormTeacher } from '@/api'
import { toast } from '@/hooks/use-toast'



export default function FormPage( ) {
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(null)

  const getForm = async (id: string): Promise<Form | null | OnErrorEventHandlerNonNull> => {
    const token = localStorage.getItem('token')
    if(token){
      const form = await getFormById(id, token)
      setForm(form.form as Form)
      return form.form as Form
    }
    return null
  }

  useState(() => {
    getForm(params?.id || "")
  })

  const handleSubmit = async (answers: AnswerType, submittedFor: string, isSendEmail:{
    studentEmail: boolean;
    teacherEmail: boolean;
    schoolAdminEmail: boolean;
    parentEmail: boolean;
}, submittedAt:Date) => {
    setIsSubmitting(true)
    const token = localStorage.getItem('token')
    
    if(token){
      const response = await submitFormTeacher(answers, submittedFor, isSendEmail, params?.id || "", token, submittedAt)
      if(!response.error){
        toast({ 
          title: 'Form submitted successfully',
          description: 'Form submitted successfully',
        })
        navigate(-1)
      }else{
        toast({
          title: 'Error submitting form',
          description: response.error,
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Error submitting form',
        description: 'Please login to submit form',
      })
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    navigate('/teachers/managepoints')
  }

  if (!form) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 ">
      <FormSubmission form={form} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      
      
    </div>
  )
}