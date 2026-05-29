import type { BobRole, BobMeResponse } from "@/platform/api/bob/me";
import { canAccess, resolveBobAccess } from "./resolveBobAccess";
import { normalizeBobOpsRole } from "./roles";

/** @deprecated Prefer `useBobAccess().can()` — capability flags for gradual migration */
export interface BobCapabilities {
  viewProgramReports: boolean;
  syncAirtable: boolean;
  manageSettings: boolean;
  resetPipeline: boolean;
  viewAllPods: boolean;
  viewIntakePipeline: boolean;
}

export function bobCapabilitiesFromMe(
  me: BobMeResponse | null | undefined,
): BobCapabilities {
  const access = resolveBobAccess(me);
  return {
    viewProgramReports: canAccess(access, "dashboard.reports"),
    syncAirtable: canAccess(access, "airtable.sync"),
    manageSettings: canAccess(access, "settings.manage"),
    resetPipeline: canAccess(access, "settings.manage"),
    viewAllPods: canAccess(access, "pods.viewAll"),
    viewIntakePipeline: canAccess(access, "intake.view"),
  };
}

/** @deprecated Pass `me` from useBobMe when possible */
export function bobCapabilities(role: BobRole): BobCapabilities {
  const opsRole = normalizeBobOpsRole({ bobRole: role });
  return bobCapabilitiesFromMe({
    bobRole: role,
    role: opsRole,
    scopeType:
      opsRole === "coach"
        ? "pod"
        : opsRole === "site_supporter"
          ? "site"
          : "organization",
    coachScope: role === "site_coach",
    coachIdentifiers: [],
    primaryPod: null,
    assignedPods: [],
    podIds: [],
    siteNames: [],
    user: null,
  });
}

export { bobRoleLabel, coachHomeHref } from "./roles";
