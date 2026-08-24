import { Role } from '@/enum';

function entityId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: string })._id);
  }
  return String(value);
}

type Actor = {
  _id?: string;
  role?: string;
  districtId?: unknown;
} | null | undefined;

type Target = {
  _id?: string;
  role?: string;
  districtId?: unknown;
  isActive?: boolean;
} | null | undefined;

export function isAdminDeactivated(admin: Target): boolean {
  return admin?.isActive === false;
}

export function adminAccessStatus(admin: Target & { hasCompletedRegistration?: boolean }): {
  label: 'Deactivated' | 'Active' | 'Pending';
  className: string;
} {
  if (isAdminDeactivated(admin)) {
    return { label: 'Deactivated', className: 'bg-red-100 text-red-700' };
  }
  if (admin?.hasCompletedRegistration) {
    return { label: 'Active', className: 'bg-green-100 text-green-700' };
  }
  return { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' };
}

export function canManageAdminActiveState(actor: Actor, target: Target): boolean {
  if (!actor || !target?._id) return false;
  if (entityId(actor._id) === entityId(target._id)) return false;
  if (target.role !== Role.DistrictAdmin && target.role !== Role.Admin) return false;
  if (actor.role === Role.SystemAdmin) return true;
  if (actor.role === Role.Admin && target.role === Role.DistrictAdmin) {
    const actorDistrict = entityId(actor.districtId);
    const targetDistrict = entityId(target.districtId);
    return Boolean(actorDistrict && targetDistrict && actorDistrict === targetDistrict);
  }
  return false;
}
