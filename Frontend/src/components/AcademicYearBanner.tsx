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
          ? "Point History keeps all-time rows until an optional points reset. Use the wizard below to back up, optionally reset points, and promote grades."
          : "Charts for the current year can look empty early after August 1. Earlier activity is still in Point History. Use Setup → Academic Lifecycle Manager for year-end backup, optional reset, and promote."}
      </p>
    </div>
  );
}
