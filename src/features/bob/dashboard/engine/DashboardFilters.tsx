"use client";

import type { DashboardScope } from "../types";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { siteFilterOptions } from "@/platform/rbac/scopedFilters";

type Props = {
  scope: DashboardScope;
  onScopeChange: (next: DashboardScope) => void;
  /** Active cohort count from latest snapshot (org view label). */
  cohortCount?: number;
};

const chipClass = (active: boolean) =>
  `px-3 py-1 rounded-full text-xs font-medium border ${
    active
      ? "bg-orange-100 border-orange-300 text-orange-800"
      : "border-gray-200 text-gray-600 hover:bg-gray-50"
  }`;

/**
 * Scope drill-down — org users narrow by site; coaches switch pod / all assigned pods.
 */
export function DashboardFilters({
  scope,
  onScopeChange,
  cohortCount,
}: Props) {
  const { access } = useBobAccess();
  const { data: me } = useBobMe();
  const sites = siteFilterOptions(access);
  const assignedPods = me?.assignedPods?.length
    ? me.assignedPods
    : access.primaryPod
      ? [{ id: access.primaryPod.id, name: access.primaryPod.name, site: null }]
      : [];

  if (access.isScoped && assignedPods.length > 0) {
    const showAllPods = assignedPods.length > 1;
    return (
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          My scope
        </span>
        {showAllPods ? (
          <button
            type="button"
            onClick={() =>
              onScopeChange({ level: "organization", label: "My cohort" })
            }
            className={chipClass(
              scope.level === "organization" && !scope.podId,
            )}
          >
            All my tracks
          </button>
        ) : null}
        {assignedPods.map((pod) => (
          <button
            key={pod.id}
            type="button"
            onClick={() =>
              onScopeChange({
                level: "pod",
                podId: pod.id,
                label: pod.name,
                siteName: pod.site ?? undefined,
              })
            }
            className={chipClass(scope.level === "pod" && scope.podId === pod.id)}
          >
            {pod.name}
          </button>
        ))}
      </div>
    );
  }

  if (access.scopeType !== "organization") {
    return (
      <p className="text-xs text-gray-500 mb-4">
        Viewing:{" "}
        <span className="font-medium text-gray-700">
          {scope.label ?? scope.level}
        </span>
      </p>
    );
  }

  const orgLabel =
    cohortCount != null && cohortCount > 0
      ? `BoB cohort (${cohortCount})`
      : "BoB cohort";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Scope
      </span>
      <button
        type="button"
        onClick={() =>
          onScopeChange({ level: "organization", label: "Organization" })
        }
        className={chipClass(scope.level === "organization")}
      >
        {orgLabel}
      </button>
      {sites.map((site) => (
        <button
          key={site}
          type="button"
          onClick={() =>
            onScopeChange({ level: "site", siteName: site, label: site })
          }
          className={chipClass(
            scope.level === "site" && scope.siteName === site,
          )}
        >
          {site}
        </button>
      ))}
    </div>
  );
}
