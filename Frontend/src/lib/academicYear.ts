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

export type CalendarMonth = { year: number; month: number };

export function calendarMonthIndex(year: number, month: number): number {
  return year * 12 + month;
}

/** Inclusive calendar range. Returns nothing when `end` is before `start`. */
export function enumerateCalendarMonths(start: CalendarMonth, end: CalendarMonth): CalendarMonth[] {
  if (calendarMonthIndex(end.year, end.month) < calendarMonthIndex(start.year, start.month)) {
    return [];
  }
  const slots: CalendarMonth[] = [];
  let year = start.year;
  let month = start.month;
  while (calendarMonthIndex(year, month) <= calendarMonthIndex(end.year, end.month)) {
    slots.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return slots;
}

function earlierCalendarMonth(a: CalendarMonth, b: CalendarMonth): CalendarMonth {
  return calendarMonthIndex(a.year, a.month) <= calendarMonthIndex(b.year, b.month) ? a : b;
}

/**
 * Months to plot so the axis never skips a calendar month.
 * All Year runs from the first recorded month through the later of the last
 * recorded month and `now`. A chosen academic year is Aug–Jul, stopped at `now`
 * when that year is still in progress. A single month across years fills any
 * missing year in between.
 */
export function buildContinuousMonthSlots({
  points,
  selectedYear,
  selectedMonth,
  now,
}: {
  points: CalendarMonth[];
  selectedYear: string;
  selectedMonth: number | "All";
  now: CalendarMonth;
}): CalendarMonth[] {
  const valid = points.filter(
    (point) => Number.isInteger(point.year) && point.month >= 1 && point.month <= 12
  );

  if (selectedMonth !== "All" && selectedYear !== "All Year") {
    const seen = new Set<string>();
    const slots: CalendarMonth[] = [];
    for (const point of valid) {
      const key = `${point.year}-${point.month}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({ year: point.year, month: point.month });
    }
    return slots;
  }

  if (selectedYear !== "All Year" && selectedMonth === "All") {
    const startYear = parseInt(selectedYear.split("-")[0], 10);
    if (!Number.isFinite(startYear)) return [];
    return enumerateCalendarMonths(
      { year: startYear, month: 8 },
      earlierCalendarMonth({ year: startYear + 1, month: 7 }, now)
    );
  }

  if (selectedMonth !== "All") {
    if (valid.length === 0) return [];
    const years = valid.map((point) => point.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const slots: CalendarMonth[] = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      slots.push({ year, month: selectedMonth });
    }
    return slots;
  }

  if (valid.length === 0) return [];
  const ordered = [...valid].sort(
    (a, b) => calendarMonthIndex(a.year, a.month) - calendarMonthIndex(b.year, b.month)
  );
  const start = ordered[0];
  const last = ordered[ordered.length - 1];
  const end =
    calendarMonthIndex(last.year, last.month) > calendarMonthIndex(now.year, now.month)
      ? last
      : now;
  return enumerateCalendarMonths(start, end);
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
