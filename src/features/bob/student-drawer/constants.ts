import type { StudentDrawerTabDef, StudentDrawerTabId } from "./types";
import type { BobPermissionId } from "@/platform/rbac/permissions";

export const STUDENT_DRAWER_SESSION_KEY = "bob:student-drawer:last-tab";

export const STUDENT_DRAWER_WIDTH =
  "w-full sm:w-[min(100%,720px)] lg:w-[820px] xl:w-[920px] 2xl:w-[980px]";

export const STUDENT_DRAWER_TABS_CONFIG: (StudentDrawerTabDef & {
  /** Hide tab when user lacks any of these permissions */
  permissions?: BobPermissionId[];
  /** Hide tab for these roles */
  denyRoles?: import("@/platform/rbac/types").BobOpsRole[];
})[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview" },
  {
    id: "attendance",
    label: "Attendance",
    shortLabel: "Attend.",
    permissions: ["attendance.view"],
  },
  {
    id: "milestones",
    label: "Deliverables",
    shortLabel: "Deliverables",
    permissions: ["milestones.view"],
  },
  {
    id: "notes",
    label: "Notes",
    shortLabel: "Notes",
    permissions: ["notes.viewStaff"],
  },
  {
    id: "incidents",
    label: "Incidents",
    shortLabel: "Incidents",
    denyRoles: ["student"],
  },
  {
    id: "onboarding",
    label: "Onboarding",
    shortLabel: "Onboard.",
    denyRoles: ["student"],
  },
  {
    id: "contracts_health",
    label: "Contracts & Health",
    shortLabel: "Health",
    denyRoles: ["student"],
  },
  { id: "demographics", label: "Personal", shortLabel: "Personal" },
  {
    id: "activity",
    label: "Activity",
    shortLabel: "Activity",
    denyRoles: ["student"],
  },
];

export const DEFAULT_STUDENT_DRAWER_TAB: StudentDrawerTabId = "overview";

export function isStudentDrawerTabId(
  v: string | null,
): v is StudentDrawerTabId {
  return STUDENT_DRAWER_TABS_CONFIG.some((t) => t.id === v);
}
