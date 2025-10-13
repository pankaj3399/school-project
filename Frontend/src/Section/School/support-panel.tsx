import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/authContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { sendSupportEmail } from "@/api";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast";

interface SupportPanelProps {
  trigger?: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportPanel = ({ trigger, isOpen, onOpenChange }: SupportPanelProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    position: user?.role === 'SchoolAdmin' ? 'System Manager' : user?.type === 'Special' ? 'Team Member/Special Teacher' : 'Leader/Lead Teacher',
    schoolName: user?.schoolId?.name ?? "",
    schoolId: user?.schoolId?._id ?? "",
    subjectGrade: user?.subject || user?.grade || "N/A",
    email: user?.email || "",
    phone: "",
    issue: "",
    contactPreference: 'email', // new default value
    state: user?.schoolId?.state ?? ""
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      // Your API call here
      await sendSupportEmail(formData);
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Error",
        description: "Failed to submit support request. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger || <Button variant="outline">Support</Button>}
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-[85vw] md:w-[80vw]">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Please, let us know the challenge you are experiencing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  disabled
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  disabled
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolId">School ID</Label>
                <Input
                  id="schoolId"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  disabled
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectGrade">Subject/Grade</Label>
                <Input
                  id="subjectGrade"
                  value={formData.subjectGrade}
                  onChange={(e) => setFormData({ ...formData, subjectGrade: e.target.value })}
                  disabled
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled
                  className="w-full"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue">Describe your issue</Label>
              <Textarea
                id="issue"
                value={formData.issue}
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                placeholder="Please, let us know the challenge you are experiencing."
                className="min-h-[100px] w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>I would like to be contacted by:</Label>
              <RadioGroup
                defaultValue="email"
                value={formData.contactPreference}
                onValueChange={(value) => setFormData({ ...formData, contactPreference: value })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="contactEmail" />
                  <Label htmlFor="contactEmail">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="contactPhone" />
                  <Label htmlFor="contactPhone">Phone {formData.phone ? '' : '(Please ensure your phone number is filled in)'}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-2 sm:mt-0">Cancel</Button>
              </DialogTrigger>
              <Button type="submit" className="bg-[#00a58c]">Submit</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Support Request</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Your Request Details:</h3>
                  <p className="whitespace-pre-wrap">{formData.issue}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Contact Preference: {formData.contactPreference}</p>
                    {formData.contactPreference === 'phone' && (
                      <p>Phone: {formData.phone}</p>
                    )}
                  </div>
                </div>
                <p><strong>SUBMIT REQUEST?</strong></p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Edit
            </Button>
            <Button
              className="bg-[#00a58c]"
              onClick={handleConfirmSubmit}
            >
              SUBMIT
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-semibold text-[#654f6f]">
              Request Submitted Successfully
            </AlertDialogTitle>

            <AlertDialogDescription className="space-y-6 text-neutral-700">
              {/* Footer message */}
              <p className="text-base text-neutral-800 font-medium mt-5">
                Got it! Our team will get back to you within 24 hours.
              </p>
              <div className="flex flex-col items-center gap-2 mt-4">
                {/* Logo Circle */}
                <div className="p-1 bg-[#654f6f]/10 rounded-full flex justify-center items-center w-20 h-20">
                  <img
                    src="/radu-logo-2.png"
                    alt="Logo"
                    className="w-20 h-20 object-contain"
                  />
                </div>

                {/* Tagline */}
                <p className="text-sm text-neutral-600 italic max-w-md">
                  “RADU E-Token — Sometimes being seen is all it takes to stay.”
                </p>
              </div>

            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              className="bg-[#00a58c]"
              onClick={() => {
                setShowSuccessDialog(false);
                setFormData({
                  fullName: user?.name || "",
                  position: user?.role === 'SchoolAdmin' ? 'System Manager' : user?.type === 'Special' ? 'Team Member/Special Teacher' : 'Leader/Lead Teacher',
                  schoolName: user?.schoolId?.name || "",
                  schoolId: user?.schoolId?._id || "",
                  subjectGrade: user?.subject || user?.grade || "",
                  email: user?.email || "",
                  phone: "",
                  issue: "",
                  contactPreference: 'email',
                  state: user?.schoolId?.state || ""
                });
              }}
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SupportPanel;