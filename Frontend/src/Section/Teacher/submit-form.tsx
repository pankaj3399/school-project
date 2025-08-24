import { useState } from 'react'
import { FormSubmission } from '@/Section/Teacher/component/form-submit'
import { useNavigate, useParams } from 'react-router-dom'
import { AnswerType, Form } from '@/lib/types'
import { getFormById, submitFormTeacher } from '@/api'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/authContext'
import { timezoneManager } from '@/lib/luxon'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"



export default function FormPage( ) {
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(null)
  const { user} = useAuth()
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false)
  const [emailVerificationError, setEmailVerificationError] = useState('')

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
}, submittedAt:Date, isManuallySet:boolean = false) => {
    setIsSubmitting(true)
    const token = localStorage.getItem('token')
    
    if(token){
      // Convert the submission date to UTC for database storage
      let convertedSubmittedAt = submittedAt;
      if(!isManuallySet && user?.schoolId?.timeZone){
        const utcDateTime = timezoneManager.convertSchoolTimeToUTC(submittedAt, user.schoolId.timeZone);
        convertedSubmittedAt = utcDateTime.toJSDate();
      }
      
      const response = await submitFormTeacher(answers, submittedFor, isSendEmail, params?.id || "", token, convertedSubmittedAt)
      if(!response.error){
        toast({ 
          title: 'Form submitted successfully',
          description: 'Form submitted successfully',
        })
        setIsSubmitting(false)
        navigate(-1)
        return // Exit early on success
      }else{
        // Extract error message from the error object
        const errorMessage = response.error?.response?.data?.message || 
                            response.error?.message || 
                            'An error occurred while submitting the form';
 
        // Check if it's an email verification error
        if (errorMessage.toLowerCase().includes('unverified') || 
            errorMessage.toLowerCase().includes('email must be verified') ||
            errorMessage.toLowerCase().includes('cannot perform operations')) {
          setEmailVerificationError('Sorry, the student\'s email is not verified. Please make sure the email is verified and try to use the form again.')
          setShowEmailVerificationDialog(true)
          setIsSubmitting(false)
          return // Exit early - don't navigate, keep form open
        } else {
          // Show other errors as toast notifications
          toast({
            title: 'Error submitting form',
            description: errorMessage,
            variant: 'destructive',
          })
        }
      }
    } else {
      toast({
        title: 'Error submitting form',
        description: 'Please login to submit form',
      })
    }
    
    // Only reach here for non-email-verification errors
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    if(user?.type == "Lead"){
      navigate('/teachers/viewforms')
    }else{
      navigate('/teachers/managepoints')
    }
  }

  if (!form) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 ">
      <FormSubmission form={form} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      
      {/* Email Verification Alert Dialog */}
      <AlertDialog open={showEmailVerificationDialog} onOpenChange={setShowEmailVerificationDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Email Verification Required</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {emailVerificationError || "Sorry, the student's email is not verified. Please make sure the email is verified and try to use the form again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowEmailVerificationDialog(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}