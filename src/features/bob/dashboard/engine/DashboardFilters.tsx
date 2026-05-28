"use client";

import type { DashboardScope } from "../types";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { siteFilterOptions } from "@/platform/rbac/scopedFilters";

type Props = {
  scope: DashboardScope;
  onScopeChange: (next: DashboardScope) => void;
};

/**
 * Scope drill-down chips — organization users can narrow site/pod;
 * scoped users see read-only context label.
 */
export function DashboardFilters({ scope, onScopeChange }: Props) {
  const { access } = useBobAccess();
  const sites = siteFilterOptions(access);

  if (access.scopeType !== "organization" && scope.level !== "organization") {
    return (
      <p className="text-xs text-gray-500 mb-4">
        Viewing: <span className="font-medium text-gray-700">{scope.label ?? scope.level}</span>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Scope
      </span>
      <button
        type="button"
        onClick={() => onScopeChange({ level: "organization", label: "Organization" })}
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          scope.level === "organization"
            ? "bg-orange-100 border-orange-300 text-orange-800"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        All program
      </button>
      {sites.map((site) => (
        <button
          key={site}
          type="button"
          onClick={() =>
            onScopeChange({ level: "site", siteName: site, label: site })
          }
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            scope.level === "site" && scope.siteName === site
              ? "bg-orange-100 border-orange-300 text-orange-800"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {site}
        </button>
      ))}
    </div>
  );
}
