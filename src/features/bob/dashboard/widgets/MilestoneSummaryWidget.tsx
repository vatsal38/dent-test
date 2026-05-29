"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { MetricBarRow } from "../primitives/MetricBarRow";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

export function MilestoneSummaryWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Milestones";

  if (loading) return <DashboardWidgetSkeleton variant="chart" />;

  const tracks = snapshot?.milestoneSubmissionByTrack ?? [];
  const items = tracks.map((t) => ({
    id: t.track,
    label: t.trackLabel?.trim() || t.track,
    value: t.submitted,
    total: t.total,
  }));

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      action={
        <Link
          href="/app/bob/milestones"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Review pending →
        </Link>
      }
    >
      <p className="text-sm text-gray-600 -mt-1 mb-3">Week 3 of 5</p>
      {items.length === 0 ? (
        <DashboardEmpty
          message="No milestone submissions for this scope yet."
          actionLabel="Milestones admin"
          actionHref="/app/bob/milestones"
        />
      ) : (
        <MetricBarRow items={items} />
      )}
    </DashboardCard>
  );
}
