import type { BobDashboardSnapshot, BobDashboardMetricKey } from "@/platform/api/bob/dashboard";
import type { KpiItem } from "@/design-system/patterns/KpiGrid";

export interface MetricDefinition {
  key: BobDashboardMetricKey;
  label: string;
  format: (v: number) => string | number;
  href?: (scope: { podId?: string; studentId?: string }) => string;
}

export const METRIC_CATALOG: Record<BobDashboardMetricKey, MetricDefinition> = {
  studentsEnrolled: {
    key: "studentsEnrolled",
    label: "Active BoB students",
    format: (v) => v,
    href: () => "/app/bob/roster",
  },
  youthWorksSynced: {
    key: "youthWorksSynced",
    label: "YouthWorks synced",
    format: (v) => `${v}%`,
    href: () => "/app/bob/roster?queue=bob_cohort",
  },
  checkedInToday: {
    key: "checkedInToday",
    label: "Checked in today",
    format: (v) => v,
    href: () => "/app/bob/attendance",
  },
  milestonesThisWeek: {
    key: "milestonesThisWeek",
    label: "Milestones this week",
    format: (v) => `${v}%`,
    href: () => "/app/bob/milestones",
  },
  openDiscrepancies: {
    key: "openDiscrepancies",
    label: "Open discrepancies",
    format: (v) => v,
    href: () => "/app/bob/attendance/discrepancies",
  },
  noShowsToday: {
    key: "noShowsToday",
    label: "No-shows today",
    format: (v) => v,
    href: () => "/app/bob/attendance",
  },
  atRiskCount: {
    key: "atRiskCount",
    label: "At-risk students",
    format: (v) => v,
    href: () => "/app/bob/roster",
  },
  escalationCount: {
    key: "escalationCount",
    label: "Needs escalation",
    format: (v) => v,
    href: () => "/app/bob/inbox",
  },
};

export function metricsToKpiItems(
  snapshot: BobDashboardSnapshot,
  keys: BobDashboardMetricKey[],
): KpiItem[] {
  return keys.map((key) => {
    const def = METRIC_CATALOG[key];
    const raw = snapshot.kpis[key]?.value ?? snapshot.cards[key as keyof typeof snapshot.cards] ?? 0;
    return {
      id: key,
      label: def.label,
      value: def.format(typeof raw === "number" ? raw : Number(raw) || 0),
      href: def.href?.({
        podId: snapshot.scope.podId ?? undefined,
        studentId: snapshot.scope.studentId ?? undefined,
      }),
    };
  });
}

/** Default KPI set for command center overview */
export const COMMAND_CENTER_KPIS: BobDashboardMetricKey[] = [
  "studentsEnrolled",
  "youthWorksSynced",
  "checkedInToday",
  "milestonesThisWeek",
  "openDiscrepancies",
];

export const POD_OPS_KPIS: BobDashboardMetricKey[] = [
  "studentsEnrolled",
  "checkedInToday",
  "noShowsToday",
  "atRiskCount",
  "escalationCount",
];
