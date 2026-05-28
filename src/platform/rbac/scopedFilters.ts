import type { BobAccessContext } from "./types";

/** Pod record shape used for client-side filtering when API is already scoped. */
export type PodScoped = { id: string; site?: string | null };

export type StudentScoped = {
  id: string;
  podId?: string | null;
  site?: string | null;
};

/**
 * Client-side pod filter — use when displaying lists that may include
 * out-of-scope rows (e.g. cached data). Server APIs apply coach scope via session.
 */
export function filterPodsByAccess<T extends PodScoped>(
  pods: T[],
  access: BobAccessContext,
): T[] {
  if (access.scopeType === "organization") return pods;
  if (access.podIds.length) {
    const allowed = new Set(access.podIds);
    return pods.filter((p) => allowed.has(p.id));
  }
  if (access.siteNames.length) {
    const sites = new Set(access.siteNames);
    return pods.filter((p) => p.site && sites.has(p.site));
  }
  return [];
}

export function filterStudentsByAccess<T extends StudentScoped>(
  students: T[],
  access: BobAccessContext,
): T[] {
  if (access.scopeType === "organization") return students;
  if (access.podIds.length) {
    const allowed = new Set(access.podIds);
    return students.filter(
      (s) => s.podId && allowed.has(s.podId),
    );
  }
  if (access.siteNames.length) {
    const sites = new Set(access.siteNames);
    return students.filter((s) => s.site && sites.has(s.site));
  }
  return [];
}

/** Default pod id for scoped dashboards (coach primary pod). */
export function defaultPodFilter(access: BobAccessContext): string {
  if (access.primaryPod?.id) return access.primaryPod.id;
  if (access.podIds.length === 1) return access.podIds[0];
  return "";
}

/** Site names for filter chips when scope is site-based. */
export function siteFilterOptions(access: BobAccessContext): string[] {
  return access.siteNames;
}
