"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";

function pctCell(value: number | undefined) {
  return (
    <span className="tabular-nums text-gray-900 font-medium">
      {value ?? 0}%
    </span>
  );
}

export function AttendanceSummaryWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Attendance";

  if (loading) return <DashboardWidgetSkeleton variant="chart" />;

  const tracks = snapshot?.attendanceBySite ?? [];
  const hasStudents = tracks.some((t) => (t.studentCount ?? t.total) > 0);

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
      {!hasStudents ? (
        <DashboardEmpty
          message="No active cohort students mapped to tracks in this scope."
          actionLabel="Open attendance grid"
          actionHref="/app/bob/attendance"
        />
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-3 font-medium">Track</th>
                <th className="pb-2 px-2 font-medium text-right">Today</th>
                <th className="pb-2 px-2 font-medium text-right">This week</th>
                <th className="pb-2 pl-2 font-medium text-right">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tracks.map((t) => (
                <tr key={t.siteId}>
                  <td className="py-2 pr-3 font-medium text-gray-900">
                    {formatBobTrackDisplayLabel(t.siteName)}
                  </td>
                  <td className="py-2 px-2 text-right">{pctCell(t.todayPct)}</td>
                  <td className="py-2 px-2 text-right">{pctCell(t.weekPct)}</td>
                  <td className="py-2 pl-2 text-right">
                    {pctCell(t.overallPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
