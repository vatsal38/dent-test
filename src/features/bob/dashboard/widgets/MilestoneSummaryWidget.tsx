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
  const title = placement.title ?? "Deliverables";

  if (loading) return <DashboardWidgetSkeleton variant="chart" />;

  const tracks = snapshot?.milestoneSubmissionByTrack ?? [];
  const trackItems = tracks.map((t) => ({
    id: t.track,
    label: t.trackLabel?.trim() || t.track,
    value: t.submitted,
    total: t.total,
  }));
  const submittedTotal =
    snapshot?.cohort?.milestoneSubmittedCount ??
    trackItems.reduce((sum, i) => sum + i.value, 0);
  const eligibleTotal =
    snapshot?.cohort?.milestoneEligibleCount ??
    trackItems.reduce((sum, i) => sum + i.total, 0);
  const pct =
    eligibleTotal > 0 ? Math.round((submittedTotal / eligibleTotal) * 100) : 0;

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      action={
        <Link
          href="/app/bob/deliverables"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Review pending →
        </Link>
      }
    >
      <p className="text-sm text-gray-600 -mt-1 mb-3">
        {submittedTotal} of {eligibleTotal} students with progress logged ({pct}
        %)
      </p>
      {trackItems.length === 0 ? (
        <DashboardEmpty
          message="No deliverable-eligible tracks in this scope."
          actionLabel="Deliverables hub"
          actionHref="/app/bob/deliverables"
        />
      ) : (
        <MetricBarRow items={trackItems} />
      )}
    </DashboardCard>
  );
}
