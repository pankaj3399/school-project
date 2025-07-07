import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { completeTeacherRegistration } from "@/api";

export default function CompleteTeacherRegistration() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    subject: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid or missing registration token.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const data = await completeTeacherRegistration({
        token,
        ...formData
      });
      if (!data.error && !data.message?.toLowerCase().includes('error')) {
        toast({
          title: "Registration Complete",
          description: "Your account has been set up. You can now sign in.",
        });
        navigate("/signin");
      } else {
        toast({
          title: "Error",
          description: data.message || "Registration failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center w-full h-full mt-20">
      <div className="bg-white shadow-xl p-4 w-72 sm:w-72 md:w-72 lg:w-96 rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Complete Your Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
          <Button type="submit" className="bg-[#00a58c]" disabled={loading}>
            {loading ? "Submitting..." : "Complete Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
} 