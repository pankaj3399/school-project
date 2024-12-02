import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import { ScrollArea } from '@/components/ui/scroll-area'
  
  type Question = {
    id: string
    text: string
    type: string
    isCompulsory: boolean
    options: string[]
  }
  
  type Form = {
    _id: string
    formName: string
    formType: string
    questions: Question[]
    createdAt: string
    schoolId: string | null
  }
  
  type FormDetailsProps = {
    form: Form
    onClose: () => void
  }
  
  export function FormDetails({ form, onClose }: FormDetailsProps) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{form.formName}</DialogTitle>
            <DialogDescription>Form Type: {form.formType}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[60vh] pr-4">
            <div className="space-y-4">
              {form.questions.map((question, index) => (
                <div key={question.id} className="border-b pb-4">
                  <h3 className="font-medium">
                    Question {index + 1}
                    {question.isCompulsory && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <p className="mt-1">{question.text}</p>
                  <p className="text-sm text-muted-foreground mt-1">Type: {question.type}</p>
                  {question.type === 'select' && question.options.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Options:</p>
                      <ul className="list-disc list-inside">
                        {question.options.map((option, optionIndex) => (
                          <li key={optionIndex} className="text-sm">{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }