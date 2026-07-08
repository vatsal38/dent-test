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
  /** True when KPIs are limited to the signed-in coach's pods/roster. */
  coachScoped?: boolean;
}

export interface BobDashboardMetricValue {
  value: number;
  unit: "count" | "percent";
}

export type BobDashboardMetricKey =
  | "studentsEnrolled"
  | "youthWorksSynced"
  | "onboardingCompleted"
  | "overallAttendancePct"
  | "checkedInToday"
  | "checkedInPctToday"
  | "deliverablesSubmitted"
  | "deliverablesCompleted"
  | "deliverablesSubmittedPctThisWeek"
  | "deliverablesCompletedPctThisWeek"
  | "milestonesThisWeek"
  | "openDiscrepancies"
  | "openIncidents"
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

export interface BobDashboardOnboardingSummary {
  total: number;
  contractSigned: number;
  contractInProgress: number;
  contractNotStarted: number;
  ywReady: number;
  ywIncomplete: number;
  preSurveyComplete: number;
  preSurveyIncomplete: number;
  preSurveyNotSynced: number;
  readyForProgram: number;
  contractAndPreSurveyComplete?: number;
  contractAndPreSurveyPending?: number;
}

export interface BobDashboardSnapshot {
  scope: BobDashboardScope;
  generatedAt: string;
  /** Active BoB cohort (Final Track) vs all students in scope. */
  cohort?: {
    activeCount: number;
    rosterTotalInScope: number;
    milestoneEligibleCount?: number;
    milestoneSubmittedCount?: number;
  };
  /** Onboarding rollup for active cohort (Airtable contract + YW fields). */
  onboarding?: BobDashboardOnboardingSummary;
  kpis: Record<BobDashboardMetricKey, BobDashboardMetricValue>;
  alerts: BobDashboardAlert[];
  queues: BobDashboardQueueItem[];
  attention: {
    blocked: number;
    late: number;
    openIncidents?: number;
    escalation: number;
  };
  incidents?: {
    openCount: number;
  };
  attendanceBySite: Array<{
    siteId: string;
    siteName: string;
    studentCount?: number;
    todayPct?: number;
    weekPct?: number;
    overallPct?: number;
    today?: { present: number; expected: number; pct: number };
    week?: { recorded: number; expected: number; pct: number };
    overall?: { recorded: number; expected: number; pct: number };
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
  milestoneSubmissionByProjectTeam?: Array<{
    teamId: string;
    teamLabel: string;
    submitted: number;
    total: number;
  }>;
  deliverableReviewByProjectTeam?: Array<{
    teamName: string;
    pendingReview: number;
    inProgress: number;
    approved: number;
    needsChanges: number;
    notStarted: number;
    total: number;
  }>;
  wellnessDistribution?: {
    total: number;
    thriving: number;
    stable: number;
    watch: number;
    concern: number;
    openWellnessChecks?: number;
    slices: Array<{
      key: "thriving" | "stable" | "watch" | "concern";
      label: string;
      count: number;
      color: string;
    }>;
  };
  weeklyMilestoneProgress?: {
    programStart: string;
    eligibleCount: number;
    weeks: Array<{
      label: string;
      weekIndex: number;
      completed: number;
      pending: number;
      missing: number;
      isCurrent?: boolean;
    }>;
  };
  atRiskStudents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    podId?: string | null;
    track?: string | null;
  }>;
  blitzTeams: Array<{
    id: string;
    name: string;
    memberCount?: number;
    points?: number;
    pointsThisWeek?: number;
  }>;
  blitzTrackTeams?: Array<{
    id: string;
    name: string;
    color?: string;
    track?: string;
    memberCount?: number;
    points?: number;
    pointsThisWeek?: number;
  }>;
  cards: {
    studentsEnrolled: number;
    youthWorksSynced: number;
    onboardingCompleted?: number;
    overallAttendancePct?: number;
    checkedInToday: number;
    checkedInPctToday?: number;
    deliverablesSubmitted?: number;
    deliverablesCompleted?: number;
    deliverablesSubmittedPctThisWeek?: number;
    deliverablesCompletedPctThisWeek?: number;
    milestonesThisWeek: number;
    openDiscrepancies: number;
    openIncidents?: number;
    studentAttendanceHours?: {
      attended: number;
      potential: number;
    };
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
