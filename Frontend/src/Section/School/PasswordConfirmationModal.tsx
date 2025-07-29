import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { verifyCurrentUserPassword, resetStudentRoster } from "@/api";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordConfirmationModal({ isOpen, onClose, onSuccess }: PasswordConfirmationModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // First verify the password
      const verifyResponse = await verifyCurrentUserPassword(password);
      
      if (verifyResponse.error) {
        setError("Invalid password. Please try again.");
        toast({
          title: "Error",
          description: "Invalid password. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // If password is verified, proceed with resetting student data
      const resetResponse = await resetStudentRoster();
      
      if (resetResponse.error) {
        toast({
          title: "Error",
          description: "Failed to reset student data. Please try again.",
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
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Confirm Student Data Reset</h2>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">⚠️ WARNING: This action cannot be undone!</p>
            <p className="text-red-700 text-sm">
              This will permanently delete <strong>ALL</strong> students and their point history data from your school. 
              This action is irreversible.
            </p>
          </div>
          
          <div>
            <p className="text-gray-700 mb-4">
              To confirm this action, please enter your current password:
            </p>
            <div>
              <Label htmlFor="password">Your Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleVerifyPassword}
              disabled={loading || !password.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
    </div>
  );
}