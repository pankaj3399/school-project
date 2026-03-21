import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { completeTeacherRegistration } from "@/api";
import { FileText, ArrowRight, CheckCircle } from "lucide-react";

export default function CompleteTeacherRegistration() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showForm, setShowForm] = useState(false);
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

  const handleProceed = () => {
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms & Conditions to proceed.",
        variant: "destructive",
      });
      return;
    }
    setShowForm(true);
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
    if (!termsAccepted) {
      toast({
        title: "Error",
        description: "You must accept the Terms & Conditions.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const data = await completeTeacherRegistration({
        token,
        termsAccepted: true,
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

  // Show Terms acceptance screen first
  if (!showForm) {
    return (
      <div className="grid place-items-center w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white shadow-xl p-8 w-full max-w-md rounded-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to RADU E-Token™</h1>
            <p className="text-gray-600 mt-2">
              Before completing your registration, please review and accept our Terms & Conditions.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 leading-relaxed cursor-pointer"
              >
                I agree that I have read and accept the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Terms & Conditions of Use
                </a>
              </label>
            </div>
          </div>

          <Button
            onClick={handleProceed}
            disabled={!termsAccepted}
            className="w-full bg-[#00a58c] hover:bg-[#008f7a] text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              Proceed to Registration
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>

          {termsAccepted && (
            <div className="flex items-center justify-center gap-2 mt-4 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Terms accepted</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show registration form after terms are accepted
  return (
    <div className="grid place-items-center w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white shadow-xl p-8 w-full max-w-md rounded-xl">
        <div className="flex items-center gap-2 text-green-600 text-sm mb-4 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span>Terms & Conditions accepted</span>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-gray-900">Complete Your Registration</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a secure password"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="subject" className="text-gray-700 font-medium">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter your subject area"
              className="mt-1"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#00a58c] hover:bg-[#008f7a] text-white py-3 font-medium transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Complete Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
} 