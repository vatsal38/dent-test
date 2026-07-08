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

function isPersonalStudentScope(scope: WidgetRenderProps["scope"]) {
  return scope.level === "student" && Boolean(scope.studentId);
}

export function AttendanceSummaryWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
  scope,
}: WidgetRenderProps) {
  const title = placement.title ?? "Attendance";
  const personal =
    isPersonalStudentScope(scope) && !placement.programWide;

  if (loading) return <DashboardWidgetSkeleton variant="table" titleWidth="w-32" />;

  if (personal && snapshot) {
    const overall = snapshot.kpis.overallAttendancePct?.value ?? snapshot.cards.overallAttendancePct ?? 0;
    const today = snapshot.kpis.checkedInToday?.value ?? snapshot.cards.checkedInToday ?? 0;
    return (
      <DashboardCard
        title={title}
        refreshing={isRefreshing}
        action={
          <Link
            href="/app/bob/attendance"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            View my attendance →
          </Link>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
              My attendance
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-950 tabular-nums">
              {overall}%
            </p>
            {snapshot.cards.studentAttendanceHours ? (
              <p className="text-xs text-emerald-900/80 mt-0.5">
                {snapshot.cards.studentAttendanceHours.attended}h of{" "}
                {snapshot.cards.studentAttendanceHours.potential}h
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Checked in today
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 tabular-nums">
              {today ? "Yes" : "No"}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-orange-950">
              Report absence or fix sign-in times
            </p>
            <p className="text-xs text-orange-900/90 mt-0.5">
              Submit a correction request for staff to review.
            </p>
          </div>
          <Link
            href="/app/bob/attendance/correction"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Open correction form
          </Link>
        </div>
      </DashboardCard>
    );
  }

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
