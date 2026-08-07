/** Academic year runs Aug 1 → Jul 31 (school-local calendar). */

export function getAcademicYearLabel(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1–12
  if (month >= 8) {
    return `${year}–${year + 1}`;
  }
  return `${year - 1}–${year}`;
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
