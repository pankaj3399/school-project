import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import { useToast } from "@/hooks/use-toast";
import { useOtpContext } from "./OtpContextProvider";
import { sendOtp } from "@/api";

export default function ForgotPassword() {
    const {updateEmail, updateRole, updateOtpId} = useOtpContext()
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    role: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
    validateField("role", value);
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "email":
        error = !/\S+@\S+\.\S+/.test(value) ? "Invalid email format" : "";
        break;
      case "role":
        error = value === "" ? "Role is required" : "";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    Object.keys(formData).forEach((key) => validateField(key, formData[key as keyof typeof formData]));
    if (Object.values(errors).some((error) => error !== "")) return;

    setLoading(true);
    try {
      const res = await sendOtp(formData);
      if(updateEmail && updateOtpId && updateRole){
          updateEmail(formData.email)
          updateRole(formData.role)
      }
      if (res.error) {
        toast({
          title: res.error.message,
          description: res.error?.response?.data?.message || "Please Try Again!!",
          variant: "destructive",
        });
        console.log("Login error:", res.error);
        
      } else {
        toast({
          title: "OTP Sent Successfully",
          description: "Redirecting to your verification",
          variant: "default",
        });
        navigate("/verify")
      }
    } catch (err) {
      console.error("OTP error:", err);
      toast({
        title: "Unexpected Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white py-44 px-4 sm:px-6 lg:px-8">
      <Header />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">Enter your email & role to get a password reset email</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email-address">Email address</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby="email-error"
              />
              {errors.email && (
                <p className="text-sm text-red-500" id="email-error">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SchoolAdmin">School Administration</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500" id="role-error">
                  {errors.role}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              {loading ? "Loading..." : "Send Email"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              OR Go back to{" "}
              <Link to="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
