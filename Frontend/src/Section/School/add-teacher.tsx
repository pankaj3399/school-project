import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { addTeacher } from "@/api";
import { Checkbox } from "@/components/ui/checkbox";
import Loading from "../Loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GRADE_OPTIONS } from "@/lib/types";

export default function AddTeacher() {
  const [formData, setFormData] = useState({
    email: "",
    checkbox: false,
    grade: "K",
    type: "Lead"
  });
  const [customGrade, setCustomGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, checkbox, type, grade } = formData;
    if (!email || !type || (type === 'Lead' && !grade)) {
      toast({
        title: "Error",
        description: "Please fill all fields.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "You are not authenticated.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const teacherData = {
        email,
        recieveMails: checkbox,
        type,
        grade: type === 'Lead' ? (formData.grade === 'OTHER' ? customGrade : formData.grade) : null,
        token,
      };
      const response = await addTeacher(teacherData, token);
      if (!response.error) {
        try {
          // await sendVerificationMail({
          //   email,
          //   role: "Teacher",
          //   url: `${window.location.origin}/teacher/complete-registration`, // New registration page
          //   userId: response.teacher._id // Assuming the response includes the created teacher's ID
          // });
          toast({
            title: "Teacher invite sent",
            description: `${email} has been invited. A registration email has been sent.`,
          });
        } catch (verificationError) {
          console.error("Verification email error:", verificationError);
          toast({
            title: "Warning",
            description: "Teacher added but registration email failed to send.",
          });
        }
        navigate("/teacher");
      } else {
        toast({
          title: "Error",
          description: "Failed to add teacher. Please try again.",
          variant: "destructive",
        });
      }
      setFormData({
        email: "",
        checkbox: false,
        grade: "K",
        type: "Special"
      });
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    alert("An unexpected error occurred. Please try again. " + error);
  }
  return (
    <div className="grid place-items-center w-full h-full mt-20">
      <div className="bg-white shadow-xl p-4 w-72  sm:w-72 md:w-72 lg:w-96 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Add Teacher</h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="flex items-center mt-2">
              <Checkbox
                checked={formData.checkbox}
                onCheckedChange={(e)=>setFormData((prevState)=>({...prevState,checkbox:e as boolean}))}
              />
              <span className="text-sm ml-2 text-semibold">
                Receive Emails
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              name="type"
              value={formData.type}
              required
              onValueChange={(value)=>{
                setFormData({
                  ...formData,
                  type: value
                })
              }}
            >
                <SelectTrigger className="w-full">
                  <SelectValue defaultValue={formData.type} placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Leader/Lead Teacher</SelectItem>
                  <SelectItem value="Special">Team Member/ Special Teacher</SelectItem>
                </SelectContent>
            </Select>
          </div>
          {formData.type === 'Lead' && (
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select
                name="grade"
                value={formData.grade}
                required
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    grade: value
                  });
                  if (value !== 'OTHER') {
                    setCustomGrade("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue defaultValue={formData.grade} placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.grade === 'OTHER' && (
                <div className="mt-2">
                  <Label htmlFor="customGrade">Specify Grade/Room</Label>
                  <Input
                    id="customGrade"
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value)}
                    placeholder="Enter custom grade or room"
                    required
                  />
                </div>
              )}
            </div>
          )}
          <Button type="submit" className="bg-[#00a58c]">Add Teacher</Button>
        </form>
      </div>
    </div>
  );
}