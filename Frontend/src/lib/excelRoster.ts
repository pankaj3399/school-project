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

export type StudentRosterRow = {
  firstName: string;
  lastName: string;
  grade: string;
  studentNumber: string;
  email: string;
  guardian1: { name: string; email: string };
  guardian2: { name: string; email: string } | null;
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[\u00a0\r\n]+/g, " ").trim();
}

function emailText(value: unknown): string {
  return text(value).replace(/\s+/g, "");
}

export function mapStudentRosterRow(
  row: Record<string, unknown>,
  gradeOptions: readonly string[],
): StudentRosterRow {
  const guardian2Name = text(cell(row, ["guardian 2 name"]));
  const guardian2Email = emailText(cell(row, ["guardian 2 email"]));

  return {
    firstName: text(cell(row, ["first name"])),
    lastName: text(cell(row, ["last name"])),
    grade: parseGrade(cell(row, ["grade"]), gradeOptions),
    studentNumber: text(cell(row, ["student number", "student id"])),
    email: emailText(cell(row, ["student email", "student e-mail"])),
    guardian1: {
      name: text(cell(row, ["guardian 1 name"])),
      email: emailText(cell(row, ["guardian 1 email"])),
    },
    guardian2:
      guardian2Name || guardian2Email
        ? { name: guardian2Name, email: guardian2Email }
        : null,
  };
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
