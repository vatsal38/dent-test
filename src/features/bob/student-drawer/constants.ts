import type { StudentDrawerTabDef, StudentDrawerTabId } from "./types";

export const STUDENT_DRAWER_SESSION_KEY = "bob:student-drawer:last-tab";

export const STUDENT_DRAWER_WIDTH =
  "w-full sm:w-[min(100%,720px)] lg:w-[820px] xl:w-[920px] 2xl:w-[980px]";

export const STUDENT_DRAWER_TABS_CONFIG: StudentDrawerTabDef[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview" },
  { id: "attendance", label: "Attendance", shortLabel: "Attend." },
  { id: "milestones", label: "Milestones", shortLabel: "Milestones" },
  { id: "notes", label: "Notes", shortLabel: "Notes" },
  { id: "incidents", label: "Incidents", shortLabel: "Incidents" },
  { id: "journey", label: "Journey", shortLabel: "Journey" },
  { id: "onboarding", label: "Onboarding", shortLabel: "Onboard." },
  { id: "demographics", label: "Demographics", shortLabel: "Demo." },
  { id: "activity", label: "Activity", shortLabel: "Activity" },
];

export const DEFAULT_STUDENT_DRAWER_TAB: StudentDrawerTabId = "overview";

export function isStudentDrawerTabId(
  v: string | null,
): v is StudentDrawerTabId {
  return STUDENT_DRAWER_TABS_CONFIG.some((t) => t.id === v);
}
