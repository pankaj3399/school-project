import { useSchool } from "@/context/SchoolContext";
import { useAuth } from "@/authContext";
import { Role } from "@/enum";

export function useSchoolSelectionGuard() {
  const { user } = useAuth();
  const { selectedSchoolId } = useSchool();
  const isMultiSchoolUser = user?.role === Role.SystemAdmin || user?.role === Role.Admin;
  const requiresSchoolSelection = isMultiSchoolUser && !selectedSchoolId;
  return { isMultiSchoolUser, requiresSchoolSelection, selectedSchoolId };
}
