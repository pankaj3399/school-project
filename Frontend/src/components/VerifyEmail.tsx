import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import { useToast } from "@/hooks/use-toast";
import { sendConfirmation } from "@/api"; // You'll need to add this API function

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState({
    emailVerificationCode: "",
    role: "",
    email: "",
    isStudent: false,
    toVerify:""
  });

  useEffect(() => {
    // Get data from URL parameters
    const otp = searchParams.get("otp");
    const role = searchParams.get("role");
    const email = searchParams.get("email");
    const isStudent = searchParams.get("isStudent");
    const toVerify = searchParams.get("toVerify");

    if (otp && role && email) {
      setVerificationData({
        emailVerificationCode: otp,
        role,
        email,
        isStudent: isStudent === "true",
        toVerify: toVerify ?? "",
      });
    }
  }, [searchParams]);

  const handleVerification = async () => {
    
    setLoading(true);
    try {
      const response = await sendConfirmation(verificationData);
      
      if (response.error) {
        toast({
          title: "Verification Failed",
          description:  "Please try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Verified Successfully",
          description: "You can now close this window",
          variant: "default",
        });
        // Optionally navigate to sign in page after delay
        setTimeout(() => navigate("/signin"), 2000);
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!verificationData.emailVerificationCode || !verificationData.role || !verificationData.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white py-44 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-red-600">Invalid Verification Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white py-44 px-4 sm:px-6 lg:px-8">
      <Header />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Click the button below to verify your email address
          </p>
          <Button
            onClick={handleVerification}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
          >
            {loading ? "Verifying..." : "Confirm Email"}
          </Button>
          
        </CardContent>
      </Card>
    </div>
  );
}