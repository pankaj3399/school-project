import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle2, ChevronRight } from "lucide-react";
import { completeTeacherRegistration, getCurrentTerms } from "@/api";
import Loading from "../Loading";
import TermsPage from "@/components/TermsPage";

export default function CompleteTeacherRegistration() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [termsVersion, setTermsVersion] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    subject: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTerms() {
      try {
        const terms = await getCurrentTerms();
        if (terms && terms.terms?.version) {
          setTermsVersion(terms.terms.version);
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      }
    }
    fetchTerms();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProceed = () => {
    if (termsAccepted) {
      setShowForm(true);
    }
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
        termsAccepted,
        termsVersion,
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

  if (loading) return <Loading />;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00a58c] to-[#007a68] bg-clip-text text-transparent mb-4">
          Invalid Registration Link
        </h1>
        <p className="text-gray-600 mb-6 max-w-md">
          This registration link appears to be invalid or expired. Please check your email or contact your administrator.
        </p>
        <Button onClick={() => navigate("/signin")} className="bg-[#00a58c] hover:bg-[#007a68] text-white">
          Go to Sign In
        </Button>
      </div>
    );
  }

  // Show Terms acceptance screen first
  if (!showForm) {
    return (
      <div className="container mx-auto p-6 max-w-4xl min-h-[80vh] flex flex-col items-center justify-center">
        <Card className="w-full border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-[#00a58c] to-[#007a68]" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto w-16 h-16 bg-[#e6f6f4] rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#00a58c]" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#00a58c] to-[#007a68] bg-clip-text text-transparent">
              Welcome to RADU E-Token™
            </CardTitle>
            <p className="text-gray-500 mt-2">
              Before completing your registration, please review and accept our Terms of Use.
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="max-h-[400px] overflow-y-auto mb-8 p-4 border rounded-xl bg-gray-50/50 scrollbar-thin scrollbar-thumb-[#00a58c]">
              <TermsPage isRegistration={true} />
            </div>
            
            <div className="flex items-start space-x-3 mb-8 p-4 bg-[#f8fdfc] rounded-lg border border-[#e6f6f4]">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1 border-[#00a58c] data-[state=checked]:bg-[#00a58c]"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I Agree that I read and accept the{" "}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#00a58c] font-bold hover:underline"
                  >
                    Terms & conditions of use
                  </a>
                </Label>
              </div>
            </div>

            <Button
              onClick={handleProceed}
              disabled={!termsAccepted}
              className="w-full bg-[#00a58c] hover:bg-[#007a68] text-white py-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 group"
            >
              Proceed to Registration
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registration form after terms are accepted
  return (
    <div className="container mx-auto p-6 max-w-4xl min-h-[80vh] flex flex-col items-center justify-center">
      <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="h-2 bg-gradient-to-r from-[#00a58c] to-[#007a68]" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-[#e6f6f4] rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#00a58c]" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#00a58c] to-[#007a68] bg-clip-text text-transparent">
            Complete Your Registration
          </CardTitle>
          <p className="text-gray-500 mt-2">Set up your teacher profile</p>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-600 ml-1">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-xl py-6 focus:ring-[#00a58c] border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600 ml-1">Create Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="rounded-xl py-6 focus:ring-[#00a58c] border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-600 ml-1">Subject Area</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g. Mathematics, Science"
                value={formData.subject}
                onChange={handleChange}
                required
                className="rounded-xl py-6 focus:ring-[#00a58c] border-gray-200"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#00a58c] hover:bg-[#007a68] text-white py-6 text-lg font-semibold rounded-xl mt-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Finish Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
 