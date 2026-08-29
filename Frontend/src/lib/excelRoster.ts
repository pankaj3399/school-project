export type TeacherRosterRow = {
  email: string;
  recieveMails: boolean;
  type: "Lead" | "Special";
  grade: string;
};

function normalizeHeader(value: string): string {
  return value
    .replace(/[\u00a0\r\n]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function cell(row: Record<string, unknown>, aliases: string[]): unknown {
  const map = new Map<string, unknown>();
  for (const [key, val] of Object.entries(row)) {
    map.set(normalizeHeader(key), val);
  }
  for (const alias of aliases) {
    const found = map.get(normalizeHeader(alias));
    if (found !== undefined && found !== null && String(found).trim() !== "") {
      return found;
    }
  }
  return undefined;
}

export function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value ?? "").trim().toLowerCase();
  return ["true", "yes", "y", "1"].includes(s);
}

export function parseTeacherType(value: unknown): "Lead" | "Special" {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "Special";
  if (/\blead(er)?\b/.test(s)) return "Lead";
  return "Special";
}

export function parseGrade(value: unknown, gradeOptions: readonly string[]): string {
  if (value === null || value === undefined || value === "") return "";
  let s: string;
  if (typeof value === "number") {
    s = Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, "");
  } else {
    s = String(value).trim();
    if (/^\d+\.0+$/.test(s)) s = String(parseInt(s, 10));
  }
  if (!s) return "";
  const match = gradeOptions.find((g) => g.toLowerCase() === s.toLowerCase());
  return match ?? s;
}

export function mapTeacherRosterRow(
  row: Record<string, unknown>,
  gradeOptions: readonly string[],
): TeacherRosterRow {
  const emailRaw = cell(row, ["email", "e-mail", "teacher email"]);
  const typeRaw = cell(row, ["type of teacher", "teacher type", "type"]);
  const gradeRaw = cell(row, ["grade"]);
  const receiveRaw = cell(row, [
    "receive emails",
    "receive mails",
    "recieve mails",
    "receive email",
  ]);

  return {
    email: String(emailRaw ?? "").trim(),
    recieveMails: parseBool(receiveRaw),
    type: parseTeacherType(typeRaw),
    grade: parseGrade(gradeRaw, gradeOptions),
  };
}
