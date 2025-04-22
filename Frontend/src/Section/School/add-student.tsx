import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { addStudent, sendVerificationMail } from "@/api/index"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import Loading from "../Loading"
import { GRADE_OPTIONS } from "@/lib/types"

const STUDENT_GRADES = GRADE_OPTIONS;

export default function AddStudent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "123456",
    className: "",
    name: "",
    parentEmail: "",
    sendNotifications: false,
    grade: "K"  // Changed initial value to "K"
  })
  const [loading, setLoading] = useState(false)


  const { toast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { name, password, className, email, parentEmail, sendNotifications, grade } = formData

    if (!name || !password  || !parentEmail) {
      toast({
        title: "Error",
        description: "Please fill all fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem("token")

      if (!token) {
        toast({
          title: "Error",
          description: "You are not authenticated.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const studentData = {
        name: name,
        password: password,
        standard: className || "",
        email : email,
        parentEmail : parentEmail,
        sendNotifications : sendNotifications,
        grade: grade        
      }


      const response = await addStudent(studentData,token)

      if (!response.error) {
        // Send verification emails to both parent emails if provided
        try {
          // Send to first parent email
          await sendVerificationMail({
            email: formData.parentEmail,
            role: "Student",
            url: `${window.location.origin}/verifyemail`,
            userId: response.student._id
          });

          // Send to second parent email if exists
          if (formData.className) {
            await sendVerificationMail({
              email: formData.className,
              role: "Student",
              url: `${window.location.origin}/verifyemail`,
              userId: response.student._id
            });
          }
          if (formData.email) {
            await sendVerificationMail({
              email: formData.email,
              isStudent: true,
              role: "Student",
              url: `${window.location.origin}/verifyemail`,
              userId: response.student._id
            });
          }

          toast({
            title: "Student added successfully",
            description: `${name} has been added and verification emails have been sent to parents.`,
          });
        } catch (verificationError) {
          console.error("Verification email error:", verificationError);
          toast({
            title: "Warning",
            description: "Student added but verification emails failed to send.",
          });
        }

        navigate("/students");
      } else {
        toast({
          title: "Error",
          description: "Failed to add student. Please try again.",
          variant: "destructive",
        })
      }

      setLoading(false)
      setFormData({
        name: "",
        password: "",
        className: "",
        email: "",
        parentEmail: "",
        sendNotifications : false,
        grade:"K"
      })

    } catch (error) {
      console.error("An unexpected error occurred. Please try again.")
      setLoading(false)

      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <Loading />
  }

  

  return (
    <div className="grid place-items-center w-full h-full mt-10 ">

      <div className="bg-white shadow-xl p-4 w-40 sm:w-60 md:w-60 lg:w-96 rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Add Student</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
       
        <div>
          <Label htmlFor="className">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select
            value={formData.grade}
            onValueChange={(value) => 
              setFormData(prev => ({
                ...prev,
                grade: value
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {STUDENT_GRADES.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="email">Parent/Guardian Email</Label>
          <div className="relative">
            <Input
              id="parentEmail"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              required
            />
            <p className="text-xs absolute top-1/2 -translate-y-1/2 right-2 text-gray-400 bg-white h-[90%] flex items-center">Guardian</p>
          </div>
        </div>
        <div>
          
          <div className="relative">
            <Input
              id="className"
              name="className"
              value={formData.className}
              onChange={handleChange}
              placeholder="Additional Parent/Guardian Email"
            />
            <p className="text-xs absolute top-1/2 -translate-y-1/2 right-2 text-gray-400 bg-white h-[90%] flex items-center">Guardian</p>
          </div>
          <span className="text-sm text-gray-500">(optional)</span>
          <br/>
          <Checkbox className="mt-2" checked={formData.sendNotifications} onCheckedChange={(e)=>setFormData({...formData,sendNotifications:e as boolean})}  /><span className="text-sm ml-2 gap-x-1 inline-block  text-semibold ">Send email notification to Parent/Guardian.</span>
        </div>
        
        
       
        <Button type="submit" className="bg-[#00a58c]">Add Student & Send Verification Emails</Button>
      </form>
    </div>
    </div>
  )
}