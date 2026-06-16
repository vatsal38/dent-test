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
    href: ({ podId }) =>
      podId
        ? `/app/bob/roster?pod=${encodeURIComponent(podId)}`
        : "/app/bob/roster?bobCohort=active",
  },
  youthWorksSynced: {
    key: "youthWorksSynced",
    label: "YouthWorks synced",
    format: (v) => `${v}%`,
    href: () => "/app/bob/roster?queue=bob_cohort",
  },
  onboardingCompleted: {
    key: "onboardingCompleted",
    label: "Onboarding completed",
    format: (v) => `${v}%`,
    href: () => "/app/bob/roster?queue=onboarding_pending",
  },
  overallAttendancePct: {
    key: "overallAttendancePct",
    label: "Overall attendance %",
    format: (v) => `${v}%`,
    href: () => "/app/bob/attendance",
  },
  checkedInToday: {
    key: "checkedInToday",
    label: "Checked in today",
    format: (v) => v,
    href: () => "/app/bob/attendance",
  },
  checkedInPctToday: {
    key: "checkedInPctToday",
    label: "Checked in today",
    format: (v) => `${v}%`,
    href: ({ podId }) =>
      podId
        ? `/app/bob/attendance?podId=${encodeURIComponent(podId)}`
        : "/app/bob/attendance",
  },
  deliverablesSubmitted: {
    key: "deliverablesSubmitted",
    label: "Deliverables submitted",
    format: (v) => v,
    href: () => "/app/bob/deliverables",
  },
  deliverablesCompleted: {
    key: "deliverablesCompleted",
    label: "Deliverables completed this week",
    format: (v) => v,
    href: () => "/app/bob/deliverables",
  },
  milestonesThisWeek: {
    key: "milestonesThisWeek",
    label: "Deliverables logged",
    format: (v) => `${v}%`,
    href: () => "/app/bob/deliverables",
  },
  openDiscrepancies: {
    key: "openDiscrepancies",
    label: "Open discrepancies",
    format: (v) => v,
    href: () => "/app/bob/attendance/discrepancies",
  },
  openIncidents: {
    key: "openIncidents",
    label: "Open incidents",
    format: (v) => v,
    href: () => "/app/bob/inbox?type=incident",
  },
  noShowsToday: {
    key: "noShowsToday",
    label: "No-shows today",
    format: (v) => v,
    href: ({ podId }) =>
      podId
        ? `/app/bob/attendance/mark?pod=${encodeURIComponent(podId)}`
        : "/app/bob/attendance/mark",
  },
  atRiskCount: {
    key: "atRiskCount",
    label: "At-risk students",
    format: (v) => v,
    href: ({ podId }) =>
      podId
        ? `/app/bob/roster?pod=${encodeURIComponent(podId)}`
        : "/app/bob/roster",
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

/** Command Center top-row KPIs — FY26 active cohort roster. */
export const COMMAND_CENTER_KPIS: BobDashboardMetricKey[] = [
  "studentsEnrolled",
  "onboardingCompleted",
  "checkedInPctToday",
  "deliverablesCompleted",
  "openDiscrepancies",
];

export const POD_OPS_KPIS: BobDashboardMetricKey[] = [
  "studentsEnrolled",
  "checkedInPctToday",
  "noShowsToday",
  "atRiskCount",
  "escalationCount",
];

/** Coach / track supporter home — daily track operations. */
export const COACH_HOME_KPIS: BobDashboardMetricKey[] = [
  "studentsEnrolled",
  "checkedInPctToday",
  "noShowsToday",
  "openIncidents",
  "atRiskCount",
];
