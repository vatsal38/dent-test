"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-gray-300",
};

export function ActionQueuesWidget({
  snapshot,
  loading,
  isRefreshing,
}: WidgetRenderProps) {
  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  const queues = snapshot?.queues ?? [];

  return (
    <DashboardCard title="Action queues" refreshing={isRefreshing}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {queues.map((q) => (
          <Link
            key={q.id}
            href={q.href}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-orange-200 hover:bg-orange-50/30 transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[q.priority] ?? PRIORITY_DOT.low}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {q.label}
              </p>
              <p className="text-xs text-gray-500">
                {q.count > 0 ? `${q.count} waiting` : "Monitor"}
              </p>
            </div>
            <span className="text-lg font-bold text-gray-900 tabular-nums">
              {q.count}
            </span>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}
