import { apiRequest } from "@/platform/api/client";

export interface BobCommandCenterStats {
  cards: {
    studentsEnrolled: number;
    youthWorksSynced: number;
    onboardingCompleted?: number;
    checkedInToday: number;
    checkedInPctToday?: number;
    deliverablesCompleted?: number;
    milestonesThisWeek: number;
    openDiscrepancies: number;
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
  }>;
  blitzTeams: Array<{
    id: string;
    name: string;
    memberCount?: number;
    points?: number;
    pointsThisWeek?: number;
  }>;
}

export async function getBobCommandCenterStats(): Promise<BobCommandCenterStats> {
  return apiRequest<BobCommandCenterStats>("/api/bob/command-center-stats");
}
