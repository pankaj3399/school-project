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
  | 'SchoolTech'      // Role.SchoolAdmin
  | 'SystemManager'   // Role.Admin / Role.DistrictAdmin
  | 'Administrator';  // Role.SystemAdmin

// Source of truth — Access Matrix from `System Overview-NOTES 4_29_2026.pdf`,
// with Schools hidden from School Tech per `System Overview-NOTES 8_12_2026.pdf`.
export const accessMatrix: Readonly<Record<TabKey, ReadonlyArray<AccessRole>>> = {
  overview:     ['Administrator'],
  analytics:    ['Administrator'],
  districts:    ['Administrator'],
  schools:      ['SystemManager', 'Administrator'],
  teachers:     ['LeadTeacher', 'SchoolTech', 'SystemManager', 'Administrator'],
  students:     ['LeadTeacher', 'SchoolTech', 'SystemManager', 'Administrator'],
  forms:        ['TeamMember', 'LeadTeacher', 'SchoolTech', 'SystemManager', 'Administrator'],
  pointHistory: ['LeadTeacher', 'SchoolTech', 'SystemManager', 'Administrator'],
  printReport:  ['LeadTeacher', 'SchoolTech', 'SystemManager', 'Administrator'],
  setup:        ['SchoolTech', 'SystemManager', 'Administrator'],
};

type ClassifiableUser = { role?: string; type?: string } | null | undefined;

export function classifyRole(user: ClassifiableUser): AccessRole | null {
  if (!user || !user.role) return null;
  switch (user.role) {
    case Role.SystemAdmin:
      return 'Administrator';
    case Role.SchoolAdmin:
      return 'SchoolTech';
    case Role.Admin:
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

// First page each role is allowed to open — matches side-nav order.
const homeTabOrder: ReadonlyArray<TabKey> = [
  'overview',
  'analytics',
  'districts',
  'schools',
  'teachers',
  'students',
  'forms',
  'pointHistory',
  'printReport',
  'setup',
];

const homePathByTab: Record<TabKey, { default: string; teacher: string }> = {
  overview:     { default: '/system-admin', teacher: '/system-admin' },
  analytics:    { default: '/analytics', teacher: '/teachers/analytics' },
  districts:    { default: '/system-admin/districts', teacher: '/system-admin/districts' },
  schools:      { default: '/system-admin/schools', teacher: '/system-admin/schools' },
  teachers:     { default: '/teacher', teacher: '/teachers/roster' },
  students:     { default: '/students', teacher: '/teachers/students' },
  forms:        { default: '/viewforms', teacher: '/teachers/viewforms' },
  pointHistory: { default: '/history', teacher: '/teachers/history' },
  printReport:  { default: '/print-report', teacher: '/teachers/print-report' },
  setup:        { default: '/setup', teacher: '/teachers/students-setup' },
};

export function homePathFor(user: ClassifiableUser): string {
  if (!user?.role) return '/signin';
  if (user.role === Role.Student) return '/student';

  const isTeacher = user.role === Role.Teacher;
  for (const tab of homeTabOrder) {
    if (!canAccess(user, tab)) continue;
    if (tab === 'forms' && isTeacher && user.type !== 'Lead') {
      return '/teachers/managepoints';
    }
    return isTeacher ? homePathByTab[tab].teacher : homePathByTab[tab].default;
  }
  return isTeacher ? '/teachers/managepoints' : '/viewforms';
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
      out.add(Role.DistrictAdmin);
    } else if (t === 'SchoolTech') {
      out.add(Role.SchoolAdmin);
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
