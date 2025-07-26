import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendResetOtp, verifyResetOtp } from "@/api";
import { Loader2 } from "lucide-react";

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OtpVerificationModal({ isOpen, onClose, onSuccess }: OtpVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await sendResetOtp();
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Check your email for the OTP to confirm student data reset.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await verifyResetOtp(otp);
      if (response.error) {
        setError(response.error?.response?.data?.message || "Invalid OTP");
        toast({
          title: "Error",
          description: response.error?.response?.data?.message || "Invalid OTP",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Student data has been reset successfully.",
      });
      onSuccess();
      onClose();
    } catch (error) {
      setError("An error occurred. Please try again.");
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtp("");
    setOtpSent(false);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Confirm Student Data Reset</h2>
        
        {!otpSent ? (
          <div>
            <p className="text-gray-600 mb-4">
              This action will permanently delete all students and their point history data from your school. 
              An OTP will be sent to your email to confirm this action.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-[#00a58c] hover:bg-[#00a58c]/90" 
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Please enter the OTP sent to your email to confirm the student data reset.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="mt-1"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || !otp.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Confirm Reset"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 