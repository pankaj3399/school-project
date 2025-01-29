import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { addStudent, getCurrentUser } from "@/api/index"
import { Checkbox } from "@/components/ui/checkbox"

import Loading from "../Loading"


export default function AddStudentTeacher() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    className: "",
    name : "",
    parentEmail : "",
    sendNotifications : false,
    grade:1
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

    const { name, password, className, email, parentEmail, sendNotifications } = formData

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
        grade:formData.grade        
      }

      console.log("Student Data",studentData)

      const response = await addStudent(studentData,token)

      if (!response.error) {
        toast({
          title: "Student added successfully",
          description:` ${name} has been added.`,
        })
        
        navigate("/teachers/students")
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
        grade:1
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

  useEffect(()=>{
    const fetchTeacher = async () => {
      const res = await getCurrentUser();
      if(res.error){
        toast({
          title: 'Error',
          description: res.error,
          variant: 'destructive'
        })
    }else{
      setFormData({
        ...formData,
        grade:res.user.grade
      })
    }
  }

    fetchTeacher()
  },[])

  

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
          <Input
            id="grade"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            disabled
            required
            type="number"
            min={1}
            max={12}
          />
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
          />
          <p className="text-xs absolute top-1/2 -translate-y-1/2 right-2 text-gray-400 bg-white h-[90%] flex items-center">Guardian</p>

          </div>
          (optional)<br/>
          <Checkbox className="mt-2" checked={formData.sendNotifications} onCheckedChange={(e)=>setFormData({...formData,sendNotifications:e as boolean})}  /><span className="text-sm ml-2 gap-x-1 inline-block  text-semibold ">Send email notification to Parent/Guardian.</span>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
       
        <Button type="submit" className="bg-[#00a58c]">Add Student</Button>
      </form>
    </div>
    </div>
  )
}
