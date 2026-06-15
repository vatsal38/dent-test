"use client";

import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

export function WeeklyMilestoneProgressWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Weekly Deliverable Progress";
  if (loading) return <DashboardWidgetSkeleton variant="weekChart" titleWidth="w-52" />;

  const weeks = snapshot?.weeklyMilestoneProgress?.weeks ?? [];
  const eligible = snapshot?.weeklyMilestoneProgress?.eligibleCount ?? 0;
  const programStart = snapshot?.weeklyMilestoneProgress?.programStart;
  const hasCurrentWeek = weeks.some((w) => w.isCurrent);

  const max = Math.max(
    1,
    ...weeks.map((w) => w.completed + w.pending + w.missing),
    eligible,
  );

  return (
    <DashboardCard title={title} refreshing={isRefreshing}>
      <p className="text-sm text-gray-600 -mt-1 mb-4">
        Progress logged per program week
        {programStart ? (
          <span className="text-gray-500"> · starts {programStart}</span>
        ) : null}
        {eligible > 0 ? (
          <span className="text-gray-500"> · {eligible} students on FY26 tracks</span>
        ) : null}
        {!hasCurrentWeek && programStart ? (
          <span className="text-amber-700"> · Program not in session yet</span>
        ) : null}
      </p>

      {weeks.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No program weeks configured.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-5 text-xs text-gray-600 mb-3 justify-center sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Logged
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Pending review
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              No submission
            </div>
          </div>

          <div
            className="grid gap-5 items-end"
            style={{
              gridTemplateColumns: `repeat(${Math.min(weeks.length, 6)}, minmax(0, 1fr))`,
            }}
          >
            {weeks.map((w) => {
              const total = w.completed + w.pending + w.missing;
              const barTotal = total > 0 ? total : max;
              const h = (barTotal / max) * 160;
              const hc = barTotal > 0 ? (w.completed / barTotal) * h : 0;
              const hp = barTotal > 0 ? (w.pending / barTotal) * h : 0;
              const hm = barTotal > 0 ? (w.missing / barTotal) * h : h;
              return (
                <div key={w.label} className="flex flex-col items-center">
                  <div
                    className={`w-16 sm:w-20 rounded-md overflow-hidden border flex flex-col justify-end ${
                      w.isCurrent
                        ? "border-orange-400 ring-2 ring-orange-200"
                        : "border-gray-200 bg-white"
                    }`}
                    style={{ height: 180 }}
                  >
                    <div style={{ height: hm }} className="bg-red-500/90" />
                    <div style={{ height: hp }} className="bg-amber-500/90" />
                    <div style={{ height: hc }} className="bg-emerald-500/90" />
                  </div>
                  <div
                    className={`mt-2 text-xs ${w.isCurrent ? "font-semibold text-orange-700" : "text-gray-600"}`}
                  >
                    {w.label}
                    {w.isCurrent ? " · now" : ""}
                  </div>
                  <div className="text-[10px] text-gray-500 tabular-nums">
                    {w.completed}/{eligible || total}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardCard>
  );
}
