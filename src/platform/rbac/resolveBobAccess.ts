import type { BobMeResponse } from "@/platform/api/bob/me";
import { ROLE_PERMISSIONS, type BobPermissionId } from "./permissions";
import { normalizeBobOpsRole } from "./roles";
import type { BobAccessContext, BobOpsRole, BobScopeType } from "./types";

function normalizeScopeType(
  raw: string | undefined,
  role: BobOpsRole,
): BobScopeType {
  if (raw === "organization" || raw === "site" || raw === "pod") return raw;
  if (role === "coach") return "pod";
  if (role === "site_supporter") return "site";
  return "organization";
}

export function resolveBobAccess(
  me: BobMeResponse | null | undefined,
): BobAccessContext {
  const role = normalizeBobOpsRole(me);
  const scopeType = normalizeScopeType(me?.scopeType, role);
  return {
    role,
    legacyBobRole: me?.bobRole ?? "read_only",
    scopeType,
    isScoped: Boolean(me?.coachScope),
    identifiers: me?.coachIdentifiers ?? [],
    podIds:
      me?.assignedPods?.length
        ? me.assignedPods.map((p) => p.id)
        : me?.podIds ?? [],
    siteNames: me?.siteNames ?? [],
    primaryPod: me?.primaryPod ?? null,
    user: me?.user ?? null,
  };
}

export function canAccess(
  access: BobAccessContext,
  permission: BobPermissionId,
): boolean {
  return ROLE_PERMISSIONS[access.role]?.has(permission) ?? false;
}

export function canAccessAny(
  access: BobAccessContext,
  permissions: BobPermissionId[],
): boolean {
  return permissions.some((p) => canAccess(access, p));
}

export function canAccessAll(
  access: BobAccessContext,
  permissions: BobPermissionId[],
): boolean {
  return permissions.every((p) => canAccess(access, p));
}
