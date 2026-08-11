/** Academic year runs Aug 1 → Jul 31 (school-local calendar). */

const MONTH_ABBREVS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const FALL_MONTHS = new Set(["Aug", "Sep", "Oct", "Nov", "Dec"]);

export function getAcademicYearLabel(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1–12
  if (month >= 8) {
    return `${year}–${year + 1}`;
  }
  return `${year - 1}–${year}`;
}

/** Calendar year that starts the current academic year (the Aug year). */
export function getAcademicYearStart(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 8 ? year : year - 1;
}

/**
 * Month axis/filter label format from product notes: Aug-2026
 * @param month 1–12 calendar month
 * @param year calendar year
 */
export function formatMonthYearLabel(month: number, year: string | number): string {
  return `${MONTH_ABBREVS[month - 1]}-${year}`;
}

/**
 * Academic-year month abbrev → Aug-2025 / Jan-2026 style label.
 * Fall months (Aug–Dec) use the academic start year; spring uses start+1.
 */
export function formatAcademicMonthLabel(
  monthAbbrev: string,
  academicStartYear: number = getAcademicYearStart()
): string {
  const year = FALL_MONTHS.has(monthAbbrev) ? academicStartYear : academicStartYear + 1;
  return `${monthAbbrev}-${year}`;
}

/** Show year-boundary guidance in July and August. */
export function isNearAcademicYearBoundary(date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  return month === 7 || month === 8;
}

export function formatEmailNotificationToast(emailNotification?: {
  total?: number;
  successful?: number;
  failed?: number;
  skipped?: string[];
} | null): string {
  if (!emailNotification) {
    return "Points saved.";
  }
  const successful = emailNotification.successful ?? 0;
  if (successful > 0) {
    return `Points saved. Email sent (${successful}).`;
  }
  const skipReason = emailNotification.skipped?.[0];
  if (skipReason) {
    return `Points saved. No email sent: ${skipReason}.`;
  }
  if ((emailNotification.failed ?? 0) > 0) {
    return "Points saved. Email delivery failed.";
  }
  return "Points saved. No email was sent.";
}
