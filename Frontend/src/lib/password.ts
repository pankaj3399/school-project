export const PASSWORD_REQUIREMENTS: string[] = [
  "At least 8 characters",
  "1 uppercase letter",
  "1 lowercase letter",
  "1 number",
  "1 special character",
];

export function validatePassword(pass: string): string {
  if (pass.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
  return "";
}
