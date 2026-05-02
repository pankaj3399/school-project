import { Role } from '@/enum';

// Tabs from the spec's Access Matrix.
export type TabKey =
  | 'overview'
  | 'analytics'
  | 'districts'
  | 'schools'
  | 'teachers'
  | 'students'
  | 'forms'
  | 'pointHistory'
  | 'printReport'
  | 'setup';

// Spec's role tiers, in plain English.
export type AccessRole =
  | 'TeamMember'      // Team Member / Teacher  (Role.Teacher, type !== 'Lead')
  | 'LeadTeacher'     // Leader / Lead Teacher  (Role.Teacher, type === 'Lead')
  | 'SystemManager'   // Role.Admin / Role.SchoolAdmin
  | 'Administrator';  // Role.SystemAdmin

// Source of truth — copy of the spec's Access Matrix on page 4 of
// `System Overview-NOTES 4_29_2026.pdf`.
export const accessMatrix: Readonly<Record<TabKey, ReadonlyArray<AccessRole>>> = {
  overview:     ['Administrator'],
  analytics:    ['Administrator'],
  districts:    ['Administrator'],
  schools:      ['SystemManager', 'Administrator'],
  teachers:     ['LeadTeacher', 'SystemManager', 'Administrator'],
  students:     ['LeadTeacher', 'SystemManager', 'Administrator'],
  forms:        ['TeamMember', 'LeadTeacher', 'SystemManager', 'Administrator'],
  pointHistory: ['LeadTeacher', 'SystemManager', 'Administrator'],
  printReport:  ['LeadTeacher', 'SystemManager', 'Administrator'],
  setup:        ['SystemManager', 'Administrator'],
};

type ClassifiableUser = { role?: string; type?: string } | null | undefined;

export function classifyRole(user: ClassifiableUser): AccessRole | null {
  if (!user || !user.role) return null;
  switch (user.role) {
    case Role.SystemAdmin:
      return 'Administrator';
    case Role.Admin:
    case Role.SchoolAdmin:
    case Role.DistrictAdmin:
      return 'SystemManager';
    case Role.Teacher:
      return user.type === 'Lead' ? 'LeadTeacher' : 'TeamMember';
    default:
      return null;
  }
}

export function canAccess(user: ClassifiableUser, tab: TabKey): boolean {
  const cls = classifyRole(user);
  if (!cls) return false;
  return accessMatrix[tab].includes(cls);
}

// Map AccessRole tiers back to backend Role strings — used by App.tsx
// ProtectedRoute requiredRoles to enforce URL-level access.
export function rolesForTab(tab: TabKey): string[] {
  const tiers = accessMatrix[tab];
  const out = new Set<string>();
  for (const t of tiers) {
    if (t === 'Administrator') out.add(Role.SystemAdmin);
    else if (t === 'SystemManager') {
      out.add(Role.Admin);
      out.add(Role.SchoolAdmin);
      out.add(Role.DistrictAdmin);
    } else if (t === 'LeadTeacher' || t === 'TeamMember') {
      // We can't gate Lead vs non-Lead at the route level (no `type` in
      // ProtectedRoute), so any Teacher passes the route check. The side-nav
      // and page-level guards still hide TeamMember-forbidden tabs by
      // calling `canAccess` directly.
      out.add(Role.Teacher);
    }
  }
  return Array.from(out);
}
