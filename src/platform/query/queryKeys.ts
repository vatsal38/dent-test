import type { BobRecruitmentListParams } from "@/platform/api/bob/recruitment";
import type { BobStudentsListParams } from "@/platform/api/bob/students";
import type { BobPodsListParams } from "@/platform/api/bob/pods";
import type { BobSubmissionsListParams } from "@/platform/api/bob/submissions";
import type { BobDashboardParams } from "@/platform/api/bob/dashboard";

export const bobKeys = {
  all: ["bob"] as const,
  me: (userId?: string | null) =>
    [...bobKeys.all, "me", userId ?? "anonymous"] as const,
  stats: () => [...bobKeys.all, "stats", "command-center"] as const,
  dashboard: (params?: BobDashboardParams) =>
    [...bobKeys.all, "dashboard", params ?? {}] as const,
  airtable: {
    status: () => [...bobKeys.all, "airtable", "status"] as const,
  },
  recruitment: {
    all: () => [...bobKeys.all, "recruitment"] as const,
    list: (params?: BobRecruitmentListParams) =>
      [...bobKeys.recruitment.all(), "list", params ?? {}] as const,
    detail: (id: string) => [...bobKeys.recruitment.all(), "detail", id] as const,
    facets: () => [...bobKeys.recruitment.all(), "facets"] as const,
    transferableIds: (params?: BobRecruitmentListParams) =>
      [...bobKeys.recruitment.all(), "transferable-ids", params ?? {}] as const,
    schema: () => [...bobKeys.recruitment.all(), "schema"] as const,
  },
  students: {
    all: () => [...bobKeys.all, "students"] as const,
    list: (params?: BobStudentsListParams) =>
      [...bobKeys.students.all(), "list", params ?? {}] as const,
    detail: (id: string) => [...bobKeys.students.all(), "detail", id] as const,
    facets: () => [...bobKeys.students.all(), "facets"] as const,
    schema: () => [...bobKeys.students.all(), "schema"] as const,
    onboarding: (id: string) =>
      [...bobKeys.students.all(), "onboarding", id] as const,
    profile: (id: string, tab: string) =>
      [...bobKeys.students.all(), "profile", id, tab] as const,
    attendance: (id: string, params?: Record<string, string>) =>
      [...bobKeys.students.all(), "attendance", id, params ?? {}] as const,
    submissions: (id: string, params?: Record<string, string>) =>
      [...bobKeys.students.all(), "submissions", id, params ?? {}] as const,
    milestones: (id: string) =>
      [...bobKeys.students.all(), "milestones", id] as const,
  },
  submissions: {
    all: () => [...bobKeys.all, "submissions"] as const,
    list: (params?: BobSubmissionsListParams) =>
      [...bobKeys.submissions.all(), "list", params ?? {}] as const,
    facets: (
      params?: Pick<
        BobSubmissionsListParams,
        "assignedTo" | "search" | "excludeArchived"
      >,
    ) => [...bobKeys.submissions.all(), "facets", params ?? {}] as const,
    detail: (id: string) => [...bobKeys.submissions.all(), "detail", id] as const,
    events: (id: string) =>
      [...bobKeys.submissions.all(), "events", id] as const,
    notifications: (params?: { orgWide?: boolean }) =>
      [...bobKeys.submissions.all(), "notifications", params ?? {}] as const,
  },
  pods: {
    all: () => [...bobKeys.all, "pods"] as const,
    list: (params?: BobPodsListParams) =>
      [...bobKeys.pods.all(), "list", params ?? {}] as const,
    detail: (id: string) => [...bobKeys.pods.all(), "detail", id] as const,
  },
  staff: {
    all: () => [...bobKeys.all, "staff"] as const,
    list: () => [...bobKeys.staff.all(), "list"] as const,
  },
  attendance: {
    all: () => [...bobKeys.all, "attendance"] as const,
    bounds: () => [...bobKeys.attendance.all(), "date-bounds"] as const,
    list: (params: import("@/platform/api/bob/attendance").BobAttendanceListParams) =>
      [...bobKeys.attendance.all(), "list", params] as const,
  },
  milestones: {
    all: () => [...bobKeys.all, "milestones"] as const,
    list: (params: import("@/platform/api/bob/milestones").BobMilestonesListParams) =>
      [...bobKeys.milestones.all(), "list", params] as const,
  },
};
