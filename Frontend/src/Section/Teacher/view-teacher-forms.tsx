import  { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormDetails } from '@/Section/School/component/form-details'
import { CalendarIcon, ClipboardIcon, StarIcon, MinusCircleIcon } from 'lucide-react'
import { getForms } from '@/api'
import { toast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { Form } from '@/lib/types'


export default function ViewTeacherForms() {
  const [forms, setForms] = useState<Form[]>([])
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    // Fetch forms from your API
    const fetchForms = async () => {
      try {
        const data = await getForms(localStorage.getItem('token')!)
        if(data.error){     
          toast({
            title: 'Error',
            description: data.error,
            variant: 'destructive'
          })
        }else{
          setForms(data.forms)
        }
      } catch (error) {
        console.error('Error fetching forms:', error)
      }
    }

    fetchForms()
  }, [])

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Forms</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card key={form._id} className="cursor-pointer hover:shadow-lg transition-shadow bg-[#97d8b2] hover:bg-[#97d8b2]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-medium text-black">{form.formName}</CardTitle>
              {getFormTypeIcon(form.formType)}
            </CardHeader>
            <CardContent>
              <CardDescription className='text-black'>{form.formType}</CardDescription>
              <div className="flex items-center pt-4">
                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />{" "}
                <span className="text-xs text-muted-foreground text-black">
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Button
                className="mt-4 w-full bg-[#ffcdd3] hover:bg-[#ffcdd3] text-black"
                onClick={() => navigate(`/teachers/submitform/${form._id}`)}
              >
                Use Form
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedForm && (
        <FormDetails form={selectedForm} onClose={() => setSelectedForm(null)} />
      )}
    </div>
  )
}
