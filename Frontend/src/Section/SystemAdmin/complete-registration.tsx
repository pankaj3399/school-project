import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle2, ChevronRight, Eye, EyeOff } from "lucide-react";
import { completeAdminRegistration, getCurrentTerms } from "@/api";
import Loading from "../Loading";
import TermsPage from "@/components/TermsPage";

export default function CompleteAdminRegistration() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const role = searchParams.get("role");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [termsVersion, setTermsVersion] = useState("");
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [fetchedTerms, setFetchedTerms] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTerms() {
      try {
        const response = await getCurrentTerms();
        if (response.error || !response.terms?.version) {
          setTermsError(true);
        } else {
          setTermsVersion(response.terms.version);
          setFetchedTerms(response.terms);
          setTermsLoaded(true);
        }
      } catch (error) {
        setTermsError(true);
        console.error("Error fetching terms:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchTerms();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
    return "";
  };

  const handleProceed = () => {
    if (termsAccepted && termsLoaded && !termsError) {
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      toast({
        title: "Error",
        description: "Invalid or missing registration link.",
        variant: "destructive",
      });
      return;
    }

    const pError = validatePassword(formData.password);
    if (pError) {
      setPasswordError(pError);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (!termsVersion) {
        toast({
          title: "Setup Error",
          description: "Could not retrieve the current terms version. Please refresh and try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      const data = await completeAdminRegistration({
        token,
        email,
        termsAccepted,
        termsVersion: termsVersion,
        name: formData.name,
        password: formData.password,
      });
      if (!data.error && !data.message?.toLowerCase().includes('error')) {
        toast({
          title: "Registration Complete",
          description: data.message || "Your administrator account has been set up. You can now sign in.",
        });
        navigate("/signin");
      } else {
        const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || data.message || "Registration failed.");
        toast({
          title: "Registration Failed",
          description: errorMsg,
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

  if (initialLoading) return <Loading />;

  if (!token || !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00a58c] to-[#007a68] bg-clip-text text-transparent mb-4">
          Invalid Registration Link
        </h1>
        <p className="text-gray-600 mb-6 max-w-md">
          This registration link appears to be invalid or expired. Please check your email or contact the system administrator.
        </p>
        <Button onClick={() => navigate("/signin")} className="bg-[#00a58c] hover:bg-[#007a68] text-white">
          Go to Sign In
        </Button>
      </div>
    );
  }

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
                <div className="text-sm font-medium leading-none">
                  <Label
                    htmlFor="terms"
                    className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I agree to the
                  </Label>
                  {" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00a58c] font-bold hover:underline"
                  >
                    Terms of Service
                  </a>
                  {" "}and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00a58c] font-bold hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </div>
              </div>
            </div>

            <Button
              onClick={handleProceed}
              disabled={!termsAccepted || !termsLoaded || termsError}
              className="w-full bg-[#00a58c] hover:bg-[#007a68] text-white py-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 group"
            >
              {termsError ? "Terms Loading Error" : !termsLoaded ? "Loading Terms..." : "Proceed to Account Setup"}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl min-h-[80vh] flex flex-col items-center justify-center">
      <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="h-2 bg-gradient-to-r from-[#00a58c] to-[#007a68]" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-[#e6f6f4] rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#00a58c]" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#00a58c] to-[#007a68] bg-clip-text text-transparent">
            Complete Registration
          </CardTitle>
          <p className="text-gray-500 mt-2">Set up your {role || "Administrator"} account</p>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600 ml-1">Email</Label>
              <Input
                id="email"
                value={email || ""}
                disabled
                className="rounded-xl py-6 bg-gray-50 border-gray-200"
              />
            </div>
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
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 leading-relaxed">
                <p className="font-semibold text-gray-700 mb-1">Password must contain:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>1 uppercase letter</li>
                  <li>1 lowercase letter</li>
                  <li>1 number</li>
                  <li>1 special character</li>
                </ul>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    handleChange(e);
                    const err = validatePassword(e.target.value);
                    setPasswordError(err);
                    if (formData.confirmPassword && e.target.value !== formData.confirmPassword) {
                      setConfirmPasswordError("Passwords do not match.");
                    } else {
                      setConfirmPasswordError("");
                    }
                  }}
                  required
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  className={`rounded-xl py-6 pr-12 focus:ring-[#00a58c] ${passwordError ? 'border-red-500' : 'border-gray-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && <p id="password-error" className="text-xs text-red-500 mt-1 ml-1">{passwordError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-600 ml-1">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    handleChange(e);
                    if (formData.password && e.target.value !== formData.password) {
                      setConfirmPasswordError("Passwords do not match.");
                    } else {
                      setConfirmPasswordError("");
                    }
                  }}
                  required
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                  className={`rounded-xl py-6 pr-12 focus:ring-[#00a58c] ${confirmPasswordError ? 'border-red-500' : 'border-gray-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPasswordError && <p id="confirm-password-error" className="text-xs text-red-500 mt-1 ml-1">{confirmPasswordError}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#00a58c] hover:bg-[#007a68] text-white py-6 text-lg font-semibold rounded-xl mt-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading || !!passwordError || !!confirmPasswordError || !formData.password || !formData.confirmPassword}
            >
              {loading ? "Completing Setup..." : "Finish Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
