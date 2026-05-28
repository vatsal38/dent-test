import type { BobStudent } from "@/platform/api/bob/students";

/** Shareable drawer tab identifiers (URL `tab` param). */
export const STUDENT_DRAWER_TABS = [
  "overview",
  "attendance",
  "milestones",
  "notes",
  "incidents",
  "journey",
  "onboarding",
  "demographics",
  "activity",
] as const;

export type StudentDrawerTabId = (typeof STUDENT_DRAWER_TABS)[number];

export interface StudentDrawerTabDef {
  id: StudentDrawerTabId;
  label: string;
  shortLabel?: string;
  /** Shown on overview KPI strip when data suggests attention */
  badge?: "alert" | "info";
}

export interface StudentDrawerContextValue {
  studentId: string;
  student: BobStudent | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  tab: StudentDrawerTabId;
  setTab: (tab: StudentDrawerTabId) => void;
  open: boolean;
  onClose: () => void;
}

export interface ActivityTimelineItem {
  id: string;
  at: string;
  kind:
    | "attendance"
    | "submission"
    | "milestone"
    | "onboarding"
    | "note"
    | "status";
  title: string;
  subtitle?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  href?: string;
}

export interface WellnessSignal {
  id: string;
  label: string;
  level: "good" | "watch" | "concern";
  detail?: string;
}

export interface CoachNote {
  id: string;
  author?: string;
  body: string;
  at?: string;
}
