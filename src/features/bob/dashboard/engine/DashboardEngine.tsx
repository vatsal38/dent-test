"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DashboardEngineProps, DashboardScope } from "../types";
import { useBobDashboard } from "../../../../platform/query/hooks/useBobDashboard";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import {
  defaultScopeFromAccess,
  mergeScopeWithSearchParams,
} from "../scope/resolveScope";
import { useDashboardLayout, colSpanClass } from "./useDashboardLayout";
import { DashboardGrid } from "./DashboardGrid";
import { DashboardFilters } from "./DashboardFilters";
import { renderWidget } from "../widgets/registry";

export function DashboardEngine({
  layoutId,
  scope: scopeProp,
  headerSlot,
  className = "",
}: DashboardEngineProps) {
  const searchParams = useSearchParams();
  const { access } = useBobAccess();

  const [scopeOverride, setScopeOverride] = useState<DashboardScope | null>(
    null,
  );

  const scope = useMemo(() => {
    const base = scopeProp ?? defaultScopeFromAccess(access);
    const merged = mergeScopeWithSearchParams(base, searchParams);
    return scopeOverride ?? merged;
  }, [scopeProp, access, searchParams, scopeOverride]);

  const { data, isLoading, isFetching, refetch } = useBobDashboard(scope);
  const { sections } = useDashboardLayout(layoutId, scope.level);

  const isRefreshing = isFetching && !isLoading;
  const resolvedLabel = data?.scope.label ?? scope.label ?? scope.level;

  return (
    <div className={className}>
      {headerSlot}

      {layoutId === "command_center" || layoutId === "coach_home" ? (
        <div className="-mt-2 mb-2 flex justify-end">
          {renderWidget("alerts_dropdown", {
            snapshot: data,
            loading: isLoading,
            isRefreshing,
            scope,
            placement: { id: "cc-alerts-dropdown-top", kind: "alerts_dropdown" },
            onRefresh: () => refetch(),
          })}
        </div>
      ) : null}

      <DashboardFilters
        scope={scope}
        onScopeChange={setScopeOverride}
        cohortCount={data?.cohort?.activeCount}
      />

      {access.isScoped && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          Metrics scoped to{" "}
          <span className="font-semibold">{resolvedLabel}</span>
          {data?.scope.coachScoped ? (
            <span className="text-orange-800">
              {" "}
              · Active BoB cohort on your tracks
            </span>
          ) : null}
          {data?.cohort?.activeCount != null ? (
            <span className="text-orange-800">
              {" "}
              · {data.cohort.activeCount} student
              {data.cohort.activeCount === 1 ? "" : "s"}
            </span>
          ) : null}
          {isRefreshing ? (
            <span className="ml-2 text-orange-700">· Updating…</span>
          ) : null}
        </div>
      )}

      {sections.map((section) => (
        <section key={section.id} className="mb-6 space-y-3">
          {section.title ? (
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              {section.title}
            </h2>
          ) : null}

          {section.widgets.some((w) => w.kind === "kpi_row") ? (
            <div className="space-y-3">
              {section.widgets
                .filter((w) => w.kind === "kpi_row")
                .map((placement) => (
                  <div key={placement.id}>
                    {renderWidget(placement.kind, {
                      snapshot: data,
                      loading: isLoading,
                      isRefreshing,
                      scope,
                      placement,
                      onRefresh: () => refetch(),
                    })}
                  </div>
                ))}
            </div>
          ) : null}

          <DashboardGrid columns={section.columns}>
            {section.widgets
              .filter((w) => w.kind !== "kpi_row" && w.kind !== "quick_actions")
              .map((placement) => (
                <div
                  key={placement.id}
                  className={`${colSpanClass(placement.colSpan)} h-full`}
                >
                  {renderWidget(placement.kind, {
                    snapshot: data,
                    loading: isLoading,
                    isRefreshing,
                    scope,
                    placement,
                    onRefresh: () => refetch(),
                  })}
                </div>
              ))}
          </DashboardGrid>

          {section.widgets
            .filter((w) => w.kind === "quick_actions")
            .map((placement) => (
              <div key={placement.id}>
                {renderWidget(placement.kind, {
                  snapshot: data,
                  loading: isLoading,
                  isRefreshing,
                  scope,
                  placement,
                  onRefresh: () => refetch(),
                })}
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
