//f
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormDetails } from '@/Section/School/component/form-details'
import { CalendarIcon, ClipboardIcon, StarIcon, MinusCircleIcon, Edit2Icon, Trash2Icon } from 'lucide-react'
import {  deleteForm, getForms } from '@/api'
import { toast } from '@/hooks/use-toast'
import { Form, Question } from '@/lib/types'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'


export default function ViewFormsTeacher() {
  const [forms, setForms] = useState<Form[]>([])
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)

  const [deleteModal, setDeleteModal] = useState<{ form: Form | null, open: boolean }>({ form: null, open: false })

  const openDeleteModal = (form: Form) => {
    setDeleteModal({ form, open: true })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ form: null, open: false })
  }

 
  useEffect(() => {
    
    const fetchForms = async () => {
      try {
        const data = await getForms(localStorage.getItem('token')!)
        if (data.error) {
          toast({
            title: 'Error',
            description: data.error,
            variant: 'destructive'
          })
        } else {
          setForms(data.forms)
        }
      } catch (error) {
        console.error('Error fetching forms:', error)
      }
    }

    fetchForms()
  }, [])
  const navigate = useNavigate();

  const getFormTypeIcon = (formType: string) => {
    switch (formType) {
      case 'AwardPoints':
        return <StarIcon className="h-6 w-6 text-yellow-500" />
      case 'Feedback':
        return <ClipboardIcon className="h-6 w-6 text-blue-500" />
      case 'PointWithdraw':
        return <MinusCircleIcon className="h-6 w-6 text-red-500" />
      case 'DeductPoints':
        return <MinusCircleIcon className="h-6 w-6 text-orange-500" />
      default:
        return <ClipboardIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const calculateTotalPoints = (questions: Question[]) =>
  {
    if(questions.length === 0) return 0
    let sum = questions.reduce((sum, question) => sum + (question.maxPoints || 0), 0) 
     questions.forEach(question => {
      if(question.type == 'select'){
        question.options?.forEach(option => {
          sum += option.points
        })
      }
    })
    return sum
  }

  const removeFromState = (id: string) => {
    setForms(prev => prev.filter(form => form._id !== id))
  }

  const removeForm = async (id: string) => {
    const removedForm = forms.filter(form => form._id === id)[0]
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error("Unauthorized request")
      const res = await deleteForm(id, token)
      removeFromState(id)
      if (res)
        return toast({
          title: "Success",
          description: `Successfully Deleted form ${res.formName}`
        })
    } catch (err) {
      setForms([...forms, removedForm])
      console.log(err)
      if (err instanceof AxiosError)
        toast({
          title: "Error",
          description: err.message
        })
      else
        toast({
          title: "Error",
          description: "Something Went Wrong"
        })
    }
  }


  return (
    <div className="container mx-auto p-4">
      <div className='flex justify-between'>
      <h1 className="text-2xl font-bold mb-6">Forms</h1>
      <Button className='bg-[#00a58c] hover:bg-[#00a58c]' onClick={()=>navigate('/teachers/createform')} >Create Form </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
        {forms.map((form) => (
          <Card key={form._id} className=" cursor-pointer hover:shadow-lg transition-shadow bg-[#97d8b2] hover:bg-[#97d8b2] ">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium text-black">{form.formName}</CardTitle>
              <div className='p-1  rounded-md'>{getFormTypeIcon(form.formType)}</div>
            </CardHeader>
            <CardContent>
              <CardDescription className='text-black'>{form.formType}</CardDescription>
              <div className="flex items-center pt-2 text-xs text-muted-foreground text-black">
                Total Points: {calculateTotalPoints(form.questions)}
              </div>
              <div className="flex items-center pt-4">
                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />{" "}
                <span className="text-xs text-muted-foreground text-black">
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className='flex items-center mt-4 gap-2'>
                <Button
                  className="flex-1 bg-[#ffcdd3] hover:bg-[#ffcdd3] text-black  hover:text-black"
                  onClick={() => setSelectedForm(form)}
                >
                  View Details
                </Button>
                {
                  (
                    <Button
                  className="flex-1 bg-[#ffcdd3] hover:bg-[#ffcdd3] text-black  hover:text-black"
                  onClick={() => navigate(`/teachers/submitform/${form._id}`)}
                >
                  Use form
                </Button>
                  )
                }

                <Button
                  className="bg-[#5c95ff] hover:bg-[#5c95ff]"
                  onClick={() => navigate(`/teachers/editform/${form._id}`)}
                >
                  <Edit2Icon />
                </Button>
                <Button
                  className="bg-[#c7b8da] hover:bg-[#c7b8da]"
                  onClick={() => openDeleteModal(form)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedForm && (
        <FormDetails form={selectedForm} onClose={() => setSelectedForm(null)} />
      )}
      {deleteModal.open && deleteModal.form && (
        <FormDeleteModal form={deleteModal.form} onClose={closeDeleteModal} remove={removeForm} />
      )}
    </div>
  )
}


const FormDeleteModal = ({ form, onClose, remove }: { form: Form, onClose: () => void, remove: (id:string) => Promise<any> }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded-md w-72">
        <h2 className="text-xl font-semibold mb-4">Delete Form</h2>
        <p>Are you sure you want to delete form <span className="font-semibold">{form.formName}</span>?</p>
        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              remove(form._id)
              onClose()
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}