"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { MetricBarRow } from "../primitives/MetricBarRow";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

export function AttendanceSummaryWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Attendance";

  if (loading) return <DashboardWidgetSkeleton variant="chart" />;

  const sites = snapshot?.attendanceBySite ?? [];
  const items = sites.map((s) => ({
    id: s.siteId,
    label: s.siteName,
    value: s.present,
    total: s.present + s.absent + s.excused + s.late,
  }));

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      action={
        <Link
          href="/app/bob/attendance"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View full grid →
        </Link>
      }
    >
      {items.length === 0 ? (
        <DashboardEmpty
          message="No attendance marked for this scope today."
          actionLabel="Open attendance grid"
          actionHref="/app/bob/attendance"
        />
      ) : (
        <MetricBarRow items={items} emptyMessage="No site data" />
      )}
    </DashboardCard>
  );
}
