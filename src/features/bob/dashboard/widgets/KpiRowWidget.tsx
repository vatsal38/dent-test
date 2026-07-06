"use client";

import { KpiGrid } from "@/design-system/patterns/KpiGrid";
import { metricsToKpiItems } from "../config/metrics";
import type { WidgetRenderProps } from "../types";
import type { BobDashboardMetricKey } from "@/platform/api/bob/dashboard";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";

export function KpiRowWidget({ snapshot, loading, placement }: WidgetRenderProps) {
  const keys = (placement.metrics ?? []) as BobDashboardMetricKey[];

  if (loading) {
    return (
      <DashboardWidgetSkeleton
        variant="kpi"
        kpiCount={Math.min(5, Math.max(2, keys.length || 5))}
      />
    );
  }
  if (!snapshot) return null;

  const studentPersonal =
    snapshot.scope?.studentId != null && keys.includes("overallAttendancePct");
  const items = metricsToKpiItems(snapshot, keys, { studentPersonal });

  return <KpiGrid items={items} columns={Math.min(5, Math.max(2, keys.length)) as 2 | 3 | 4 | 5} />;
}
