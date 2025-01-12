import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import { useToast } from "@/hooks/use-toast";
import { verifyOtp } from "@/api";
import { useOtpContext } from "./OtpContextProvider";

export default function OtpVerificationPage() {
    const {role, email, updateOtpId} = useOtpContext()
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    otp:""
  });
  const [errors, setErrors] = useState({
    otp:""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "otp":
        error = value === "" ? "Otp is required" : "";
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
      const res = await verifyOtp({
        ...formData,
        email,
        role
      });
      if (res.error) {
        toast({
          title: res.error.message,
          description: res.error?.response?.data?.message || "Please Try Again!!",
          variant: "destructive",
        });
        console.log("Verification error:", res.error);
        
      } else {
        toast({
          title: "OTP Verified Successfully",
          description: "Redirecting to reset",
          variant: "default",
        });
        if(updateOtpId)
            updateOtpId(res.otpId)
        navigate("/resetpassword")
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
          <CardTitle className="text-2xl font-bold text-center">Enter OTP</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Input
                id="otp"
                name="otp"
                type="text"
                required
                className="w-full"
                placeholder="Enter your otp here"
                value={formData.otp}
                onChange={handleChange}
                aria-invalid={errors.otp ? "true" : "false"}
                aria-describedby="otp-error"
              />
              {errors.otp && (
                <p className="text-sm text-red-500" id="otp-error">
                  {errors.otp}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              {loading ? "Loading..." : "Verify"}
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
