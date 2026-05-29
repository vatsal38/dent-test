import type { BobAccessContext } from "@/platform/rbac/types";
import type { DashboardScope, DashboardScopeLevel } from "../types";
import type { BobDashboardParams } from "@/platform/api/bob/dashboard";

export function scopeToApiParams(scope: DashboardScope): BobDashboardParams {
  const params: BobDashboardParams = { scope: scope.level };
  if (scope.siteName) params.site = scope.siteName;
  if (scope.podId) params.podId = scope.podId;
  if (scope.track) params.track = scope.track;
  if (scope.studentId) params.studentId = scope.studentId;
  return params;
}

/** Default scope from RBAC session — coaches land on pod scope. */
export function defaultScopeFromAccess(access: BobAccessContext): DashboardScope {
  if (access.scopeType === "pod") {
    if (access.podIds.length > 1) {
      return { level: "organization", label: "My cohort" };
    }
    if (access.primaryPod?.id) {
      return {
        level: "pod",
        podId: access.primaryPod.id,
        label: access.primaryPod.name,
      };
    }
  }
  if (access.scopeType === "site" && access.siteNames[0]) {
    return {
      level: "site",
      siteName: access.siteNames[0],
      label: access.siteNames[0],
    };
  }
  return { level: "organization", label: "Organization" };
}

export function mergeScopeWithSearchParams(
  base: DashboardScope,
  searchParams: URLSearchParams,
): DashboardScope {
  const level = searchParams.get("scope") as DashboardScopeLevel | null;
  const siteName = searchParams.get("site") || undefined;
  const podId = searchParams.get("podId") || undefined;
  const track = searchParams.get("track") || undefined;
  const studentId = searchParams.get("studentId") || undefined;

  if (!level && !siteName && !podId && !track && !studentId) return base;

  return {
    level: level || (studentId ? "student" : podId ? "pod" : siteName ? "site" : base.level),
    siteName: siteName ?? base.siteName,
    podId: podId ?? base.podId,
    track: track ?? base.track,
    studentId: studentId ?? base.studentId,
    label: base.label,
  };
}

export function scopeLevelRank(level: DashboardScopeLevel): number {
  const order: DashboardScopeLevel[] = [
    "organization",
    "site",
    "pod",
    "track",
    "student",
  ];
  return order.indexOf(level);
}
