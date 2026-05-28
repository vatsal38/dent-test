"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

export function WellnessAlertsWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Wellness & attendance";

  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  const count = snapshot?.noShowsToday.length ?? 0;

  // When no explicit title is provided (e.g. command center banner placement),
  // render a compact strip instead of a full card to match the prototype.
  if (!placement.title) {
    return (
      <div
        className={`mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-opacity ${isRefreshing ? "opacity-80" : ""}`}
      >
        <p className="text-sm text-orange-900">
          <span className="font-semibold">{count}</span> missing clock-in
          {count === 1 ? "" : "s"} today.
        </p>
        <Link
          href="/app/bob/attendance"
          className="text-sm font-medium text-orange-700 hover:text-orange-800 shrink-0"
        >
          Resolve missing clock-ins →
        </Link>
      </div>
    );
  }

  return (
    <DashboardCard title={title} refreshing={isRefreshing}>
      {count === 0 ? (
        <DashboardEmpty
          title="All clear"
          message="No missing clock-ins for this scope today."
        />
      ) : (
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-amber-700">{count}</span> student
          {count === 1 ? "" : "s"} need follow-up for missing attendance.
        </p>
      )}
      <Link
        href="/app/bob/attendance"
        className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        Resolve missing clock-ins →
      </Link>
    </DashboardCard>
  );
}
