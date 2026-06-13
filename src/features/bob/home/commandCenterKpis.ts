import type { BobCommandCenterStats } from "@/platform/api/bob/stats";
import type { BobDashboardSnapshot } from "@/platform/api/bob/dashboard";
import {
  COMMAND_CENTER_KPIS,
  metricsToKpiItems,
} from "@/features/bob/dashboard/config/metrics";

/** @deprecated Prefer dashboard engine + metricsToKpiItems */
export function commandCenterToKpis(stats: BobCommandCenterStats) {
  const snapshot = {
    ...stats,
    scope: {
      level: "organization" as const,
      siteName: null,
      podId: null,
      track: null,
      studentId: null,
      label: "Organization",
    },
    generatedAt: new Date().toISOString(),
    kpis: {
      studentsEnrolled: { value: stats.cards.studentsEnrolled, unit: "count" as const },
      youthWorksSynced: { value: stats.cards.youthWorksSynced, unit: "percent" as const },
      onboardingCompleted: {
        value: stats.cards.onboardingCompleted ?? stats.cards.youthWorksSynced,
        unit: "percent" as const,
      },
      overallAttendancePct: { value: 0, unit: "percent" as const },
      checkedInToday: { value: stats.cards.checkedInToday, unit: "count" as const },
      checkedInPctToday: {
        value: stats.cards.checkedInPctToday ?? 0,
        unit: "percent" as const,
      },
      deliverablesSubmitted: { value: 0, unit: "count" as const },
      deliverablesCompleted: {
        value: stats.cards.deliverablesCompleted ?? 0,
        unit: "count" as const,
      },
      milestonesThisWeek: { value: stats.cards.milestonesThisWeek, unit: "percent" as const },
      openDiscrepancies: { value: stats.cards.openDiscrepancies, unit: "count" as const },
      openIncidents: { value: 0, unit: "count" as const },
      noShowsToday: { value: stats.noShowsToday.length, unit: "count" as const },
      atRiskCount: { value: stats.atRiskStudents.length, unit: "count" as const },
      escalationCount: {
        value:
          stats.noShowsToday.length + stats.atRiskStudents.length + stats.cards.openDiscrepancies,
        unit: "count" as const,
      },
    },
    alerts: [],
    queues: [],
    attention: { blocked: 0, late: 0, escalation: 0 },
  } satisfies BobDashboardSnapshot;
  return metricsToKpiItems(snapshot, COMMAND_CENTER_KPIS);
}
