"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

function StatRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900 tabular-nums">
          {value}/{total}
          <span className="text-gray-500 font-normal ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function OnboardingSummaryWidget({
  loading,
  isRefreshing,
  placement,
  snapshot,
}: WidgetRenderProps) {
  const title = placement.title ?? "Onboarding";
  const onboarding = snapshot?.onboarding;
  const total = onboarding?.total ?? snapshot?.cohort?.activeCount ?? 0;

  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  if (!onboarding || total === 0) {
    return (
      <DashboardCard title={title} refreshing={isRefreshing}>
        <DashboardEmpty
          message="No active BoB cohort students in scope for onboarding rollup."
          actionLabel="Student roster"
          actionHref="/app/bob/roster?queue=bob_cohort"
        />
      </DashboardCard>
    );
  }

  const ready =
    onboarding.contractAndPreSurveyComplete ?? onboarding.readyForProgram;
  const pending =
    onboarding.contractAndPreSurveyPending ?? Math.max(0, total - ready);

  return (
    <DashboardCard title={title} refreshing={isRefreshing}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{ready}</span> of{" "}
          <span className="font-semibold text-gray-900">{total}</span> with
          contract and pre-survey complete
          {pending > 0 ? (
            <span className="text-amber-700"> · {pending} pending</span>
          ) : null}
        </p>
        <StatRow
          label="Contract signed"
          value={onboarding.contractSigned}
          total={total}
        />
        <StatRow
          label="YouthWorks ready"
          value={onboarding.ywReady}
          total={total}
        />
        <StatRow
          label="Pre-survey complete"
          value={onboarding.preSurveyComplete}
          total={total}
        />
        {onboarding.preSurveyNotSynced > 0 ? (
          <p className="text-xs text-gray-500">
            {onboarding.preSurveyNotSynced} without email match on BoB All
            Students — status from Airtable &quot;BoB &apos;25 Pre-Survey
            Done&quot;.
          </p>
        ) : null}
        <Link
          href={
            pending > 0
              ? "/app/bob/roster?queue=onboarding_pending"
              : "/app/bob/roster?queue=bob_cohort"
          }
          className="inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          {pending > 0 ? "Review onboarding queue →" : "Review cohort roster →"}
        </Link>
      </div>
    </DashboardCard>
  );
}
