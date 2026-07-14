"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

const AIRTABLE_ONBOARDING_VIEW =
  "https://airtable.com/appjDzuL6WUmrcZ5d/tblWX69llgeaLCKlT/viwo67vEM2OeW9Hva?blocks=hide";

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

  const ready = onboarding.contractAndPreSurveyComplete ?? 0;
  const pending =
    onboarding.contractAndPreSurveyPending ?? Math.max(0, total - ready);
  const parentOk = onboarding.parentContractSatisfied ?? onboarding.contractSigned;
  const youthOk = onboarding.youthContractSigned ?? onboarding.contractSigned;

  return (
    <DashboardCard title={title} refreshing={isRefreshing}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{ready}</span> of{" "}
          <span className="font-semibold text-gray-900">{total}</span> with
          parent contract, youth contract, and pre-survey complete
          {pending > 0 ? (
            <span className="text-amber-700"> · {pending} pending</span>
          ) : null}
        </p>
        <StatRow
          label="Parent contract satisfied"
          value={parentOk}
          total={total}
        />
        <StatRow
          label="Youth contract signed"
          value={youthOk}
          total={total}
        />
        <StatRow
          label="Youth pre-survey complete"
          value={onboarding.preSurveyComplete}
          total={total}
        />
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
        <p className="text-[11px] text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
          Counts use active BoB &apos;26 roster students in scope. Status from
          Airtable fields{" "}
          <span className="font-medium text-gray-600">
            BoB &apos;26 Parent Contract Status
          </span>
          ,{" "}
          <span className="font-medium text-gray-600">
            BoB &apos;26 Student Contract Status
          </span>
          , and{" "}
          <span className="font-medium text-gray-600">
            BoB &apos;26 Pre-Survey Status
          </span>
          . Update those in{" "}
          <a
            href={AIRTABLE_ONBOARDING_VIEW}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gray-700"
          >
            Airtable
          </a>
          ; they appear in Dent Ops after roster sync (Settings → Airtable sync).
        </p>
      </div>
    </DashboardCard>
  );
}
