import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { completeGuardianRegistration, getCurrentTerms } from "@/api";
import Loading from "../Loading";
import { CheckCircle2, ChevronRight, FileText } from "lucide-react";
import TermsPage from "@/components/TermsPage";

export default function CompleteGuardianRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVersion, setTermsVersion] = useState("");
  const [fetchedTerms, setFetchedTerms] = useState<any>(null);
  const [passwordError, setPasswordError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function fetchTerms() {
      try {
        const terms = await getCurrentTerms();
        if (terms && terms.terms?.version) {
          setTermsVersion(terms.terms.version);
          setFetchedTerms(terms.terms);
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      }
    }
    fetchTerms();
  }, []);

  if (!token || !email) {
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

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
    return "";
  };

  const handleProceed = () => {
    if (termsAccepted) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordError) {
      toast({
        title: "Validation Error",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }
    // The instruction had an unclosed `if (!token) {` block here.
    // Assuming the intent was to ensure token exists before proceeding,
    // but the initial check `if (!token || !email)` already handles this.
    // If a separate check was intended here, it needs a proper block.
    // For now, I'm integrating the password mismatch check as it was.
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await completeGuardianRegistration({
        token,
        email,
        name: formData.name,
        password: formData.password,
        termsAccepted,
        termsVersion
      });

      if (result.error) {
        toast({
          title: "Registration Failed",
          description: result.error || result.error?.message || result.message || "Registration failed.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Your account has been set up. You can now sign in.",
        });
        navigate("/signin");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-6 max-w-4xl min-h-[80vh] flex flex-col items-center justify-center">
      {step === 1 ? (
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
              Before we get started, please review and accept our Terms of Use.
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="max-h-[400px] overflow-y-auto mb-8 p-4 border rounded-xl bg-gray-50/50 scrollbar-thin scrollbar-thumb-[#00a58c]">
              <TermsPage isRegistration={true} terms={fetchedTerms} />
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
      ) : (
        <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-[#00a58c] to-[#007a68]" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto w-16 h-16 bg-[#e6f6f4] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#00a58c]" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#00a58c] to-[#007a68] bg-clip-text text-transparent">
              Complete Your Registration
            </CardTitle>
            <p className="text-gray-500 mt-2">Personalize your Guardian account</p>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-600 ml-1">Email Address</Label>
                <Input 
                  id="email" 
                  value={email} 
                  disabled 
                  className="bg-gray-100 border-none rounded-xl py-6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-600 ml-1">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl py-6 focus:ring-[#00a58c] border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-600 ml-1">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPasswordError(validatePassword(e.target.value));
                  }}
                  required
                  className={`rounded-xl py-6 focus:ring-[#00a58c] ${passwordError ? 'border-red-500' : 'border-gray-200'}`}
                  aria-invalid={!!passwordError}
                />
                {passwordError && <p className="text-xs text-red-500 mt-1 ml-1">{passwordError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-600 ml-1">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
      )}
    </div>
  );
}
