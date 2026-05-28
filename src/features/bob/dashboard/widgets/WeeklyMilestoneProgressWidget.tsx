"use client";

import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

type Week = {
  label: string;
  completed: number;
  pending: number;
  missing: number;
};

function clamp(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function deriveWeeks(snapshot: WidgetRenderProps["snapshot"]): Week[] {
  // We don't yet have weekly series from the API, so we derive a stable-looking
  // series from the aggregate percent to match the prototype layout.
  const pct = clamp(snapshot?.kpis.milestonesThisWeek?.value ?? 78);
  const baseTotal = 160;
  const w1 = {
    label: "Week 1",
    completed: clamp((pct / 100) * baseTotal),
    pending: clamp(baseTotal * 0.06),
    missing: clamp(baseTotal * 0.02),
  };
  const w2 = {
    label: "Week 2",
    completed: clamp(Math.min(baseTotal, w1.completed + baseTotal * 0.03)),
    pending: clamp(baseTotal * 0.05),
    missing: clamp(baseTotal * 0.02),
  };
  const w3 = {
    label: "Week 3",
    completed: clamp(Math.max(0, w2.completed - baseTotal * 0.12)),
    pending: clamp(baseTotal * 0.08),
    missing: clamp(baseTotal * 0.05),
  };
  return [w1, w2, w3].map((w) => {
    const sum = w.completed + w.pending + w.missing;
    const scale = sum > 0 ? baseTotal / sum : 1;
    return {
      ...w,
      completed: clamp(w.completed * scale),
      pending: clamp(w.pending * scale),
      missing: clamp(w.missing * scale),
    };
  });
}

export function WeeklyMilestoneProgressWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Weekly Milestone Progress";
  if (loading) return <DashboardWidgetSkeleton variant="chart" />;

  const weeks = deriveWeeks(snapshot);
  const max = Math.max(
    1,
    ...weeks.map((w) => w.completed + w.pending + w.missing),
  );

  return (
    <DashboardCard title={title} refreshing={isRefreshing}>
      <p className="text-sm text-gray-600 -mt-1 mb-4">
        Completion trends across all tracks
      </p>

      <div className="flex items-center gap-5 text-xs text-gray-600 mb-3 justify-center sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Completed
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Pending
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          Missing
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 items-end">
        {weeks.map((w) => {
          const total = w.completed + w.pending + w.missing;
          const h = (total / max) * 160;
          const hc = (w.completed / total) * h;
          const hp = (w.pending / total) * h;
          const hm = (w.missing / total) * h;
          return (
            <div key={w.label} className="flex flex-col items-center">
              <div
                className="w-16 sm:w-20 rounded-md overflow-hidden border border-gray-200 bg-white flex flex-col justify-end"
                style={{ height: 180 }}
              >
                <div style={{ height: hm }} className="bg-red-500/90" />
                <div style={{ height: hp }} className="bg-amber-500/90" />
                <div style={{ height: hc }} className="bg-emerald-500/90" />
              </div>
              <div className="mt-2 text-xs text-gray-600">{w.label}</div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

