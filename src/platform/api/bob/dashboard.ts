import { apiRequest } from "@/platform/api/client";

export type BobDashboardScopeLevel =
  | "organization"
  | "site"
  | "pod"
  | "track"
  | "student";

export interface BobDashboardScope {
  level: BobDashboardScopeLevel;
  siteName: string | null;
  podId: string | null;
  track: string | null;
  studentId: string | null;
  label: string;
}

export interface BobDashboardMetricValue {
  value: number;
  unit: "count" | "percent";
}

export type BobDashboardMetricKey =
  | "studentsEnrolled"
  | "youthWorksSynced"
  | "checkedInToday"
  | "milestonesThisWeek"
  | "openDiscrepancies"
  | "noShowsToday"
  | "atRiskCount"
  | "escalationCount";

export interface BobDashboardAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body?: string;
  href?: string;
}

export interface BobDashboardQueueItem {
  id: string;
  label: string;
  count: number;
  href: string;
  priority: "low" | "medium" | "high";
}

export interface BobDashboardSnapshot {
  scope: BobDashboardScope;
  generatedAt: string;
  kpis: Record<BobDashboardMetricKey, BobDashboardMetricValue>;
  alerts: BobDashboardAlert[];
  queues: BobDashboardQueueItem[];
  attention: {
    blocked: number;
    late: number;
    escalation: number;
  };
  attendanceBySite: Array<{
    siteId: string;
    siteName: string;
    present: number;
    absent: number;
    excused: number;
    late: number;
    total: number;
  }>;
  noShowsToday: string[];
  milestoneSubmissionByTrack: Array<{
    track: string;
    trackLabel?: string;
    submitted: number;
    total: number;
  }>;
  atRiskStudents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    podId?: string | null;
    track?: string | null;
  }>;
  blitzTeams: Array<{ id: string; name: string }>;
  cards: {
    studentsEnrolled: number;
    youthWorksSynced: number;
    checkedInToday: number;
    milestonesThisWeek: number;
    openDiscrepancies: number;
  };
}

export interface BobDashboardParams {
  scope?: BobDashboardScopeLevel;
  site?: string;
  podId?: string;
  track?: string;
  studentId?: string;
}

function buildDashboardQuery(params?: BobDashboardParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.scope) q.set("scope", params.scope);
  if (params.site) q.set("site", params.site);
  if (params.podId) q.set("podId", params.podId);
  if (params.track) q.set("track", params.track);
  if (params.studentId) q.set("studentId", params.studentId);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getBobDashboard(
  params?: BobDashboardParams,
): Promise<BobDashboardSnapshot> {
  return apiRequest<BobDashboardSnapshot>(
    `/api/bob/dashboard${buildDashboardQuery(params)}`,
  );
}
