import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast" 
import { useNavigate } from "react-router-dom" 
import { addTeacher } from "@/api"



import Loading from "../Loading"

export default function AddTeacher() {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    subject: "",
    email:""
  })
  const [loading, setLoading] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
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

    const { name, password, subject,email } = formData

    if (!name || !password || !subject) {
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

      const teacherData = {
        name,
        password,
        subject,
        email,
        token, 
      }

      const response = await addTeacher(teacherData,token)

      if (response.status === 200) {
        toast({
          title: "Teacher added successfully",
          description: `${name} has been added.`,
        })
        
        navigate("/viewteachers")
      } else {
        toast({
          title: "Error",
          description: "Failed to add teacher. Please try again.",
          variant: "destructive",
        })
      }

      setLoading(false)  

    } catch (error) {
      setError("An unexpected error occurred. Please try again.")  
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

  if (error) {
   
    alert("An unexpected error occurred. Please try again. " + error);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Add Teacher</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
          <Label htmlFor="name">Email</Label>
          <Input
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
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
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />
        </div>
        <Button type="submit">Add Teacher</Button>
      </form>
    </div>
  )
}
