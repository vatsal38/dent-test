"use client";

import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

/** Placeholder until onboarding tasks are wired into dashboard snapshot. */
export function OnboardingSummaryWidget({
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Onboarding";

  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  return (
    <DashboardCard title={title} refreshing={isRefreshing}>
      <DashboardEmpty
        message="Onboarding task rollup will appear when student scope includes task API."
        actionLabel="Student roster"
        actionHref="/app/bob/roster"
      />
    </DashboardCard>
  );
}
