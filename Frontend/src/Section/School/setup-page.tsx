import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Loading from "../Loading";
import { getCurrrentSchool, getReportDataStudentCombined } from "@/api";
import PasswordConfirmationModal from "./PasswordConfirmationModal";
import { useSchool } from "@/context/SchoolContext";
import { useAuth } from "@/authContext";
import { Role } from "@/enum";
import { LifecycleManager } from "./components/setup/LifecycleManager";
import { DangerZone } from "./components/setup/DangerZone";
import { Sparkles, School } from "lucide-react";
import { GRADE_OPTIONS } from "@/lib/types";
import * as XLSX from "xlsx";

const SetupPage = () => {
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const { toast } = useToast();
  const { selectedSchoolId } = useSchool();
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalSchoolId, setModalSchoolId] = useState<string | null>(null);

  const isAdmin = user?.role === Role.SystemAdmin || user?.role === Role.Admin;

  useEffect(() => {
    let isCancelled = false;
    const fetchSchool = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Clear stale state immediately when selection changes
        setSchool(null);
        setLoading(true);

        if (isAdmin && !selectedSchoolId) {
          if (!isCancelled) setLoading(false);
          return;
        }

        const data = await getCurrrentSchool(token, selectedSchoolId || undefined);
        if (!isCancelled) {
          setSchool(data.school || null);
        }
      } catch (error) {
        console.error("Failed to fetch school data:", error);
        if (!isCancelled) setSchool(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchSchool();
    return () => { isCancelled = true; };
  }, [selectedSchoolId, user, isAdmin]);

  const handleOpenResetModal = () => {
    if (loading) return;
    const resolvedId = selectedSchoolId || school?._id;
    if (resolvedId) {
      setModalSchoolId(resolvedId);
      setShowPasswordModal(true);
    }
  };

  const handleDownloadSnapshot = async (): Promise<boolean> => {
    if (loading) return false;
    try {
      const resolvedSchoolId = selectedSchoolId || school?._id;
      if (!resolvedSchoolId) {
        toast({ title: "Export Failed", description: "No school selected.", variant: "destructive" });
        return false;
      }

      const report = await getReportDataStudentCombined(GRADE_OPTIONS, resolvedSchoolId);
      if (report?.error || !report?.gradeData) {
        throw new Error(report?.error || "Unable to load snapshot data.");
      }

      const studentRows: any[] = [];
      const teacherRows: any[] = [];
      const historyRows: any[] = [];
      const seenTeachers = new Set<string>();

      report.gradeData.forEach((gradeInfo: any) => {
        (gradeInfo.teachers || []).forEach((t: any) => {
          if (t?._id && !seenTeachers.has(t._id)) {
            seenTeachers.add(t._id);
            teacherRows.push({
              Name: t.name || "",
              Subject: t.subject || "",
              Type: t.type || "",
              Grade: t.grade || gradeInfo.grade || "",
            });
          }
        });

        (gradeInfo.students || []).forEach((entry: any) => {
          const s = entry.student || {};
          studentRows.push({
            Name: s.name || "",
            Grade: s.grade || gradeInfo.grade || "",
            "Student Email": s.email || "",
            "Parent Email": s.parentEmail || "",
            "Total Points": s.points ?? 0,
            eTokens: entry.totalPoints?.eToken ?? 0,
            Oopsies: Math.abs(entry.totalPoints?.oopsies ?? 0),
            Withdrawals: Math.abs(entry.totalPoints?.withdraw ?? 0),
          });

          (entry.history || []).forEach((h: any) => {
            historyRows.push({
              Student: s.name || "",
              Grade: s.grade || gradeInfo.grade || "",
              Date: h.submittedAt ? new Date(h.submittedAt).toLocaleString() : "",
              Action: h.formType || "",
              Points: h.points ?? 0,
              "Submitted By": h.submittedByName || "",
            });
          });
        });
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentRows), "Students");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(teacherRows), "Teachers");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(historyRows), "Points History");

      const fileName = `full-year-snapshot-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: "Snapshot Ready", description: "Your full-year snapshot has been downloaded." });
      return true;
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error?.message || "Could not build snapshot.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDownloadWaitlist = async (): Promise<boolean> => {
    if (loading) return false;
    let url: string | null = null;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "Export Failed", description: "You must be signed in to export the waitlist.", variant: "destructive" });
        return false;
      }

      const resolvedSchoolId = selectedSchoolId || school?._id;
      if (!resolvedSchoolId) {
        toast({ title: "Export Failed", description: "No school selected.", variant: "destructive" });
        return false;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/waitlist/export${resolvedSchoolId ? `?schoolId=${encodeURIComponent(resolvedSchoolId)}` : ''}`, {
        method: 'GET',
        headers: { 'token': `${token}` }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waitlist-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({ title: "Export Complete", description: "Your waitlist has been downloaded as an XLSX file." });
      return true;
    } catch (error) {
      toast({ title: "Export Failed", description: "Could not retrieve waitlist data.", variant: "destructive" });
      return false;
    } finally {
      if (url) window.URL.revokeObjectURL(url);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-neutral-100 px-8 py-10 mb-8 sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="container mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-1.5 flex-1 max-w-2xl">
            <div className="flex items-center gap-2 text-teal-600 font-black uppercase tracking-[0.25em] text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Maintenance Hub</span>
            </div>
            <h1 className="text-5xl font-black text-neutral-900 tracking-tight leading-tight">
              {school?.name || "Lifecycle Management"}
            </h1>
            <p className="text-neutral-600 font-medium text-xl leading-relaxed max-w-xl">Perform year-end maintenance, promote students, and handle roster rollovers.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Header utilities removed as per feedback */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 max-w-5xl">
        {!school && isAdmin ? (
          <div className="py-20 flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-24 h-24 bg-teal-50 rounded-[2.5rem] flex items-center justify-center border-2 border-teal-100/50 shadow-2xl shadow-teal-100/20 rotate-3">
              <School className="w-12 h-12 text-teal-600" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-neutral-900 tracking-tight">Maintenance Launchpad</h2>
              <p className="text-neutral-500 text-lg font-medium leading-relaxed">
                Welcome, Administrator. Please select a specific school from the context switcher above to begin maintenance or lifecycle management.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Maintenance Section Gating */}
            {(selectedSchoolId || school?._id) && !loading ? (
              <>
                {/* Primary Activity: Lifecycle Wizard */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-6 w-1 bg-blue-500 rounded-full" />
                    <h2 className="text-xl font-bold text-neutral-800 tracking-tight">Annual Transition Wizard</h2>
                  </div>
                  <LifecycleManager
                    schoolId={selectedSchoolId || school?._id || ""}
                    onDownloadWaitlist={handleDownloadWaitlist}
                    onDownloadSnapshot={handleDownloadSnapshot}
                  />
                </div>

                {/* Maintenance Utilities */}
                <div className="pt-12 border-t border-neutral-100 space-y-8">
                  <div className="space-y-1.5 px-2">
                    <h2 className="text-xl font-bold text-neutral-800 tracking-tight">Advanced Maintenance</h2>
                    <p className="text-sm text-neutral-500 font-medium leading-relaxed max-w-2xl">
                      Use these utilities for manual roster clearing and irreversible administrative resets. Ensure you have a backup before proceeding.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <DangerZone onResetRoster={handleOpenResetModal} />
                  </div>
                </div>

                <PasswordConfirmationModal
                  isOpen={showPasswordModal}
                  onClose={() => {
                    setShowPasswordModal(false);
                    setModalSchoolId(null);
                  }}
                  onSuccess={() => {
                    setShowPasswordModal(false);
                    setModalSchoolId(null);
                    toast({ title: "Roster Reset", description: "The student roster has been cleared successfully." });
                  }}
                  schoolId={modalSchoolId || ""}
                />
              </>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-4 bg-white/50 rounded-3xl border border-dashed border-neutral-200">
                <School className="w-12 h-12 text-neutral-300" />
                <p className="text-neutral-500 font-medium">
                  {loading ? "Refreshing management data..." : "Please select a school to access the Transition Wizard and Maintenance Tools."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupPage;