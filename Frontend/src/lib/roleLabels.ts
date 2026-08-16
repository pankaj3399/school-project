import { Role } from '@/enum';

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [Role.SchoolAdmin]: 'School Tech',
  [Role.SystemAdmin]: 'Admin',
  [Role.DistrictAdmin]: 'District Admin',
  [Role.Admin]: 'District Manager',
  [Role.Teacher]: 'Team Member',
  [Role.Student]: 'Student',
  [Role.Guardian]: 'Guardian',
};

function collapsed(value: string): string {
  return value.replace(/[\s_-]+/g, '').toLowerCase();
}

/** Product-facing label for a stored Role enum value (e.g. SchoolAdmin → School Tech). */
export function formatRoleName(role?: string | null): string {
  if (!role) return '';
  const key = String(role).trim();
  if (ROLE_DISPLAY_NAMES[key]) return ROLE_DISPLAY_NAMES[key];
  const match = Object.keys(ROLE_DISPLAY_NAMES).find((k) => collapsed(k) === collapsed(key));
  if (match) return ROLE_DISPLAY_NAMES[match];
  return key.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const SCHOOL_TECH_CONTACT_ALIASES = new Set([
  'school tech',
  'tech partner',
  'tech-partner',
  'techpartner',
]);

/** Platform Role shown in School Tech / admin tables. Legacy "Tech partner" displays as School Tech. */
export function formatContactRole(contactRole?: string | null): string {
  if (!contactRole) return 'Leadership';
  const normalized = contactRole.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (SCHOOL_TECH_CONTACT_ALIASES.has(normalized) || collapsed(contactRole) === 'schooltech') {
    return 'School Tech';
  }
  return contactRole;
}

export const CONTACT_ROLE_SCHOOL_TECH = 'School Tech';
export const CONTACT_ROLE_LEADERSHIP = 'Leadership';
