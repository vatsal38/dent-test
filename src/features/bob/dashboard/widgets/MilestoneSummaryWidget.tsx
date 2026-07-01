"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { MetricBarRow } from "../primitives/MetricBarRow";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";

function isPersonalStudentScope(scope: WidgetRenderProps["scope"]) {
  return scope.level === "student" && Boolean(scope.studentId);
}

export function MilestoneSummaryWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
  scope,
}: WidgetRenderProps) {
  const title = placement.title ?? "Deliverables";
  const personal = isPersonalStudentScope(scope);

  if (loading) return <DashboardWidgetSkeleton variant="metricBars" titleWidth="w-36" />;

  if (personal && snapshot) {
    const submitted =
      snapshot.kpis.deliverablesSubmitted?.value ??
      snapshot.cards.deliverablesSubmitted ??
      0;
    const completed =
      snapshot.kpis.deliverablesCompleted?.value ??
      snapshot.cards.deliverablesCompleted ??
      0;
    const submittedPct =
      snapshot.kpis.deliverablesSubmittedPctThisWeek?.value ??
      snapshot.cards.deliverablesSubmittedPctThisWeek ??
      0;

    return (
      <DashboardCard
        title={title}
        refreshing={isRefreshing}
        action={
          <Link
            href="/app/bob/deliverables"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            View deliverables →
          </Link>
        }
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-sky-800">
              Submitted
            </p>
            <p className="mt-1 text-2xl font-bold text-sky-950 tabular-nums">{submitted}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-950 tabular-nums">{completed}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
              This week
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{submittedPct}%</p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  const tracks = snapshot?.milestoneSubmissionByTrack ?? [];
  const trackItems = tracks.map((t) => ({
    id: t.track,
    label: formatBobTrackDisplayLabel(t.trackLabel?.trim() || t.track),
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
