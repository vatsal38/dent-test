import type { BobPermissionId } from "./permissions";
import type { BobAccessContext } from "./types";

/** Staff with roster.edit, or students editing their own linked roster row only. */
export function canEditStudentRecord(
  can: (permission: BobPermissionId) => boolean,
  linkedStudentId: string | null | undefined,
  studentId: string | null | undefined,
): boolean {
  if (!studentId) return false;
  if (can("roster.edit")) return true;
  return (
    can("roster.editSelf") &&
    Boolean(linkedStudentId) &&
    linkedStudentId === studentId
  );
}

export function isStudentRole(access: BobAccessContext): boolean {
  return access.role === "student";
}

/** True when a student user is viewing their own linked roster record. */
export function isOwnStudentProfile(
  access: BobAccessContext,
  linkedStudentId: string | null | undefined,
  studentId: string | null | undefined,
): boolean {
  if (!isStudentRole(access)) return false;
  return Boolean(linkedStudentId && studentId && linkedStudentId === studentId);
}
