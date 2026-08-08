import { getAcademicYearLabel, isNearAcademicYearBoundary } from "@/lib/academicYear";

type AcademicYearBannerProps = {
  variant?: "analytics" | "setup";
};

export function AcademicYearBanner({ variant = "analytics" }: AcademicYearBannerProps) {
  if (!isNearAcademicYearBoundary()) return null;

  const yearLabel = getAcademicYearLabel();

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
      <p className="font-semibold">Academic year is Aug 1–Jul 31. You are in {yearLabel}.</p>
      <p className="mt-1 text-blue-800/80">
        {variant === "setup"
          ? "Download an Excel backup, then use Year-End Student Wipe to delete student, parent, and points data. Teachers and school settings stay."
          : "Charts for the current year can look empty early after August 1. Earlier activity is still in Point History. Use Setup → Year-End Student Wipe after the report window."}
      </p>
    </div>
  );
}
