import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Eraser, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { verifyCurrentUserPassword, yearEndStudentWipe } from "@/api";
import { PasswordConfirmModal } from "@/Section/SystemAdmin/schools/PasswordConfirmModal";
import { getErrorMessage } from "@/lib/errors"

interface YearEndWipeProps {
  schoolId: string;
  onDownloadSnapshot: () => Promise<boolean>;
}

export const YearEndWipe: React.FC<YearEndWipeProps> = ({
  schoolId,
  onDownloadSnapshot,
}) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [snapshotDownloaded, setSnapshotDownloaded] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [wipeResult, setWipeResult] = useState<{
    students: number;
    pointHistories: number;
    guardianAccounts: number;
  } | null>(null);
  const currentSchoolIdRef = useRef(schoolId);

  useEffect(() => {
    currentSchoolIdRef.current = schoolId;
    setSnapshotDownloaded(false);
    setWipeResult(null);
    setShowPasswordModal(false);
    setIsDownloading(false);
    setIsWiping(false);
  }, [schoolId]);

  const isStale = (capturedSchoolId: string) => currentSchoolIdRef.current !== capturedSchoolId;

  const handleDownload = async () => {
    if (isDownloading) return;
    const capturedSchoolId = schoolId;
    setIsDownloading(true);
    try {
      const ok = await onDownloadSnapshot();
      if (isStale(capturedSchoolId)) return;
      setSnapshotDownloaded(!!ok);
      if (ok) {
        toast({
          title: "Backup downloaded",
          description: "Keep this Excel file. You can delete student data after this backup.",
        });
      }
    } catch (error) {
      if (isStale(capturedSchoolId)) return;
      setSnapshotDownloaded(false);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to export snapshot.",
        variant: "destructive",
      });
    } finally {
      if (!isStale(capturedSchoolId)) setIsDownloading(false);
    }
  };

  const handleWipeWithPassword = async (password: string) => {
    if (!schoolId) {
      toast({ title: "Error", description: "School context is missing.", variant: "destructive" });
      throw new Error("School context is missing.");
    }

    const capturedSchoolId = schoolId;
    setIsWiping(true);
    try {
      const verify = await verifyCurrentUserPassword(password);
      if (isStale(capturedSchoolId)) return;
      if (verify?.error) {
        throw new Error(getErrorMessage(verify, "Password verification failed. Please try again."));
      }

      const response = await yearEndStudentWipe(capturedSchoolId);
      if (isStale(capturedSchoolId)) return;
      if (response.error) {
        throw new Error(getErrorMessage(response, "Year-end wipe failed"));
      }

      const deleted = (response as any).deleted || {};
      setWipeResult({
        students: deleted.students || 0,
        pointHistories: deleted.pointHistories || 0,
        guardianAccounts: deleted.guardianAccounts || 0,
      });
      setShowPasswordModal(false);
      toast({
        title: "Year-end wipe complete",
        description: "Student, parent, and points data were deleted. Teachers and school settings were kept.",
      });
    } finally {
      if (!isStale(capturedSchoolId)) setIsWiping(false);
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden ring-1 ring-teal-200">
      <CardHeader className="bg-gradient-to-br from-teal-50 to-white border-b border-teal-100 p-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
            <Eraser className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-neutral-900">Year-End Student Wipe</CardTitle>
            <CardDescription className="text-neutral-600 text-sm font-medium">
              Download an Excel backup, then delete this school’s student, parent, and points data. Teachers stay.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-left">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">Irreversible after backup</p>
            <p className="opacity-90 text-xs mt-1">
              Deletes students, parent/guardian accounts, point history, feedback, and related submissions for this school only.
              Form templates and teacher contacts are kept. Re-import the roster for the new year.
            </p>
          </div>
        </div>

        {wipeResult ? (
          <div className="rounded-2xl border border-green-100 bg-green-50/70 p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
            <p className="font-bold text-green-900">Wipe completed</p>
            <p className="text-sm text-green-800">
              Removed {wipeResult.students} students, {wipeResult.pointHistories} point-history rows, and {wipeResult.guardianAccounts} guardian accounts.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleDownload}
              disabled={isDownloading || isWiping}
              variant="outline"
              className="h-14 px-6 rounded-2xl gap-2 border-neutral-200 hover:bg-neutral-50 font-bold"
            >
              {snapshotDownloaded ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <FileSpreadsheet className="w-4 h-4" />}
              {isDownloading ? "Preparing snapshot..." : snapshotDownloaded ? "Snapshot Downloaded" : "1. Download Excel backup"}
            </Button>
            <Button
              onClick={() => setShowPasswordModal(true)}
              disabled={!snapshotDownloaded || isWiping || isDownloading}
              title={!snapshotDownloaded ? "Download the Excel backup before deleting student data." : undefined}
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2 disabled:opacity-50"
            >
              <Eraser className="w-4 h-4" />
              {isWiping ? "Deleting..." : "2. Delete student data"}
            </Button>
          </div>
        )}
      </CardContent>

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleWipeWithPassword}
        title="Confirm year-end student wipe"
        description="This permanently deletes student, parent, and points data for this school. Teachers and school settings are kept. Enter your password to continue."
        confirmText="Delete student data"
        isLoading={isWiping}
      />
    </Card>
  );
};
