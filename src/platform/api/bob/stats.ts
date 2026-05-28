import { apiRequest } from "@/platform/api/client";

export interface BobCommandCenterStats {
  cards: {
    studentsEnrolled: number;
    youthWorksSynced: number;
    checkedInToday: number;
    milestonesThisWeek: number;
    openDiscrepancies: number;
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
    submitted: number;
    total: number;
  }>;
  atRiskStudents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    status: string;
  }>;
  blitzTeams: Array<{ id: string; name: string }>;
}

export async function getBobCommandCenterStats(): Promise<BobCommandCenterStats> {
  return apiRequest<BobCommandCenterStats>("/api/bob/command-center-stats");
}
