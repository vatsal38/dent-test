"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

export function AtRiskListWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "At-risk students";

  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  const students = snapshot?.atRiskStudents ?? [];

  const isCommandCenterToday = placement.id === "cc-at-risk";

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      className={
        isCommandCenterToday
          ? "border-rose-200 bg-rose-50"
          : ""
      }
      action={
        <Link
          href="/app/bob/roster"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View all →
        </Link>
      }
    >
      <p className="text-sm text-gray-600 -mt-1 mb-3">
        {students.length} student{students.length === 1 ? "" : "s"} need attention
      </p>
      {students.length === 0 ? (
        <DashboardEmpty message="None flagged in this scope." />
      ) : (
        <div className="space-y-2">
          {students.slice(0, 8).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between text-sm gap-2"
            >
              <span className="text-gray-900">
                {s.firstName} {s.lastName}
                <span className="ml-2 text-xs text-gray-500">({s.status})</span>
              </span>
              <Link
                href={`/app/bob/roster/${s.id}`}
                className="text-orange-600 hover:text-orange-700 shrink-0 text-xs font-medium"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
