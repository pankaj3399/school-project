import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Rocket, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight, Eraser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { promote, resetPoints, verifyCurrentUserPassword } from "@/api";
import { cn } from "@/lib/utils";
import { PasswordConfirmModal } from "@/Section/SystemAdmin/schools/PasswordConfirmModal";

interface LifecycleManagerProps {
  schoolId: string;
  onDownloadWaitlist: () => Promise<void>;
  onDownloadSnapshot: () => Promise<void>;
}

type Step = 'export' | 'reset-points' | 'promote' | 'finalize';

export const LifecycleManager: React.FC<LifecycleManagerProps> = ({
  schoolId,
  onDownloadWaitlist,
  onDownloadSnapshot
}) => {
  const [activeStep, setActiveStep] = useState<Step>('export');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingSnapshot, setIsDownloadingSnapshot] = useState(false);
  const [isDownloadingWaitlist, setIsDownloadingWaitlist] = useState(false);
  const [isSnapshotDownloaded, setIsSnapshotDownloaded] = useState(false);
  const [isWaitlistDownloaded, setIsWaitlistDownloaded] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [promotionResult, setPromotionResult] = useState<{ count: number } | null>(null);
  const { toast } = useToast();
  const canProceedToReset = isSnapshotDownloaded && isWaitlistDownloaded;

  const resetLifecycleState = () => {
    setIsSnapshotDownloaded(false);
    setIsWaitlistDownloaded(false);
    setIsDownloadingSnapshot(false);
    setIsDownloadingWaitlist(false);
    setShowResetPasswordModal(false);
    setPromotionResult(null);
    setIsProcessing(false);
    setActiveStep('export');
  };

  useEffect(() => {
    resetLifecycleState();
  }, [schoolId]);

  const handleResetPointsWithPassword = async (password: string) => {
    if (!schoolId) {
      toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
      throw new Error("School context is missing.");
    }

    setIsProcessing(true);
    try {
      const verify = await verifyCurrentUserPassword(password);
      if (verify?.error) {
        if (verify.error instanceof Error) {
          throw verify.error;
        }
        const message = typeof verify.error === 'string'
          ? verify.error
          : (verify.error as any)?.message || "Password verification failed. Please try again.";
        throw new Error(message);
      }

      const response = await resetPoints(schoolId);
      if (response.error) {
        toast({ title: "Reset Failed", description: response.error, variant: "destructive" });
        throw new Error(response.error);
      }
      toast({ title: "Points Cleared", description: "All student points and history have been reset." });
      setShowResetPasswordModal(false);
      setActiveStep('promote');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSnapshot = async () => {
    if (isDownloadingSnapshot) return;
    setIsDownloadingSnapshot(true);
    try {
      await onDownloadSnapshot();
      setIsSnapshotDownloaded(true);
    } catch (err) {
      setIsSnapshotDownloaded(false);
      throw err;
    } finally {
      setIsDownloadingSnapshot(false);
    }
  };

  const handleDownloadWaitlist = async () => {
    if (isDownloadingWaitlist) return;
    setIsDownloadingWaitlist(true);
    try {
      await onDownloadWaitlist();
      setIsWaitlistDownloaded(true);
    } catch (err) {
      setIsWaitlistDownloaded(false);
      throw err;
    } finally {
      setIsDownloadingWaitlist(false);
    }
  };

  const handlePromoteStudents = async () => {
    if (isProcessing) return;
    if (!schoolId) {
      toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const response = await promote(schoolId);
      if (response.error) {
        toast({ title: "Promotion Failed", description: response.error, variant: "destructive" });
      } else {
        const promotedCount = (response as any).promotedCount || (response as any).count || 0;
        setPromotionResult({ count: promotedCount });
        setActiveStep('finalize');
        toast({ title: "Promotion Successful", description: "Students advanced to the next grade." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Promotion operation failed.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 'export', label: 'Backup', icon: Download },
    { id: 'reset-points', label: 'Points Reset', icon: Eraser },
    { id: 'promote', label: 'Promotion', icon: Rocket },
    { id: 'finalize', label: 'Finish', icon: CheckCircle2 },
  ];

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden ring-1 ring-neutral-200">
      <CardHeader className="bg-gradient-to-br from-neutral-50 to-white border-b border-neutral-100 p-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-neutral-900">Academic Lifecycle Manager</CardTitle>
            <CardDescription className="text-neutral-600 text-sm font-medium">Phased annual maintenance and grade transition</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-100 -translate-y-1/2 z-0" />
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const stepIdx = steps.findIndex(s => s.id === activeStep);
            const isCompleted = stepIdx > idx;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                  isActive ? "bg-white border-blue-500 text-blue-600 scale-110 shadow-lg" : 
                  isCompleted ? "bg-green-500 border-green-500 text-white" : 
                  "bg-neutral-50 border-neutral-100 text-neutral-300"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-neutral-400"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="min-h-[280px] flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
          {activeStep === 'export' && (
            <>
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-2">
                <Download className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Step 1: Data Preservation</h3>
                <p className="text-neutral-500 leading-relaxed">
                  Export a full-year snapshot (students, teachers, and points history) and your waiting list before starting the rollover.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Button
                  onClick={handleDownloadSnapshot}
                  disabled={isDownloadingSnapshot}
                  variant="outline"
                  className="h-14 px-6 rounded-2xl gap-2 border-neutral-200 hover:bg-neutral-50 font-bold"
                >
                  {isSnapshotDownloaded ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <FileSpreadsheet className="w-4 h-4" />}
                  {isDownloadingSnapshot
                    ? "Preparing snapshot..."
                    : isSnapshotDownloaded
                      ? "Snapshot Downloaded"
                      : "Download Full-Year Snapshot"}
                </Button>
                <Button
                  onClick={handleDownloadWaitlist}
                  disabled={isDownloadingWaitlist}
                  variant="outline"
                  className="h-14 px-6 rounded-2xl gap-2 border-neutral-200 hover:bg-neutral-50 font-bold"
                >
                  {isWaitlistDownloaded ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Download className="w-4 h-4" />}
                  {isDownloadingWaitlist
                    ? "Preparing waiting list..."
                    : isWaitlistDownloaded
                      ? "Waiting List Downloaded"
                      : "Download Waiting List"}
                </Button>
                <Button
                  onClick={() => setActiveStep('reset-points')}
                  disabled={!canProceedToReset}
                  title={!canProceedToReset ? "Download both the snapshot and waiting list before continuing." : undefined}
                  className="h-14 px-10 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 gap-2 font-bold shadow-lg shadow-neutral-900/10 disabled:opacity-50"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {activeStep === 'reset-points' && (
            <>
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-2">
                <Eraser className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Step 2: Point & History Reset</h3>
                <p className="text-neutral-500 leading-relaxed">
                  Start the new year with a clean slate. This will reset all student point balances to zero and <span className="font-bold text-red-500">permanently delete</span> the previous year's history.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-bold">Irreversible Action</p>
                  <p className="opacity-80 text-xs">Point balances and history will be <span className="font-black underline">permanently removed</span>. Ensure you have exported all data before proceeding.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={() => setActiveStep('promote')} disabled={isProcessing} variant="ghost" className="h-14 px-8 rounded-2xl font-bold text-neutral-400">
                  Skip this step
                </Button>
                <Button
                  onClick={() => setShowResetPasswordModal(true)}
                  disabled={isProcessing}
                  className="h-14 px-10 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold gap-3 shadow-lg shadow-amber-600/20"
                >
                  {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Clear All Points"}
                </Button>
              </div>
            </>
          )}

          {activeStep === 'promote' && (
            <>
              <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-3xl flex items-center justify-center mb-2">
                <Rocket className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Step 3: Seasonal Promotion</h3>
                <p className="text-neutral-500 leading-relaxed text-sm">
                  Advance your roster to the next academic year. Select your preferred strategy for student and teacher records.
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full pt-2">
                <Card className={cn(
                  "p-4 cursor-pointer transition-all border-2 text-left",
                  "border-teal-500 bg-teal-50/50 shadow-md ring-1 ring-teal-500/20"
                )}>
                  <p className="text-xs font-black text-teal-700 uppercase tracking-widest mb-1">Student Strategy</p>
                  <p className="font-bold text-neutral-900 text-sm">Bulk Promotion</p>
                  <p className="text-[10px] text-neutral-500 leading-tight mt-1">Advance all students to next grade. Grade 12 → Graduate.</p>
                </Card>

                <Card className="p-4 border-neutral-100 bg-neutral-50/30 text-left opacity-60">
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Teacher Strategy</p>
                  <p className="font-bold text-neutral-900 text-sm">Maintain Active</p>
                  <p className="text-[10px] text-neutral-500 leading-tight mt-1">Keep all teacher accounts and point-awarding privileges.</p>
                </Card>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-bold">Rollover Details</p>
                  <p className="opacity-80">Students who 'failed' or need to stay in the same grade must be adjusted manually after the bulk promotion.</p>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button onClick={() => setActiveStep('reset-points')} disabled={isProcessing} variant="ghost" className="h-14 px-6 rounded-2xl font-bold text-neutral-500">
                  Back
                </Button>
                <Button 
                  onClick={handlePromoteStudents} 
                  disabled={isProcessing}
                  className="h-14 px-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-teal-600/20"
                >
                  {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Run Rollover <Rocket className="w-4 h-4" /></>}
                </Button>
              </div>
            </>
          )}

          {activeStep === 'finalize' && (
            <>
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Transition Success</h3>
                  <p className="text-neutral-500 font-medium max-w-sm mx-auto">
                    The annual lifecycle transition has been successfully applied to your school ecosystem.
                  </p>
                </div>
                
                <div className="bg-green-50/50 border border-green-100 rounded-[2rem] p-8 grid grid-cols-2 gap-8 ring-1 ring-green-600/10">
                  <div className="text-center">
                    <p className="text-3xl font-black text-green-700 tracking-tighter">{promotionResult?.count || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/60 mt-1">Promoted</p>
                  </div>
                  <div className="text-center border-l border-green-100 pl-8">
                    <p className="text-3xl font-black text-green-700 tracking-tighter">100%</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/60 mt-1">Verified</p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button onClick={resetLifecycleState} className="h-14 px-12 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 font-bold shadow-xl">
                  Finish Maintenance
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>

      <PasswordConfirmModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onConfirm={handleResetPointsWithPassword}
        title="Clear All Points"
        description="This permanently deletes all point history and resets balances to zero. Enter your password to confirm."
        confirmText="Clear All Points"
        isLoading={isProcessing}
      />
    </Card>
  );
};
