import type { BobPermissionId } from "./permissions";

export type BobNavConfigItem = {
  href: string;
  label: string;
  iconKey:
    | "dashboard"
    | "roster"
    | "intake"
    | "pods"
    | "attendance"
    | "milestones"
    | "inbox"
    | "myPod"
    | "submit"
    | "settings"
    | "staff";
  permission: BobPermissionId;
  /** Show in primary sidebar vs "More" submenu */
  section: "primary" | "more";
  /** Insert after this href (primary nav ordering) */
  after?: string;
};

export const BOB_NAV_CONFIG: BobNavConfigItem[] = [
  {
    href: "/app/bob",
    label: "Dashboard",
    iconKey: "dashboard",
    permission: "dashboard.view",
    section: "primary",
  },
  {
    href: "/app/bob/my-pod",
    label: "My Pod",
    iconKey: "myPod",
    permission: "myPod.view",
    section: "primary",
    after: "/app/bob",
  },
  {
    href: "/app/bob/roster",
    label: "Roster",
    iconKey: "roster",
    permission: "roster.view",
    section: "primary",
  },
  {
    href: "/app/bob/recruitment",
    label: "Intake",
    iconKey: "intake",
    permission: "intake.view",
    section: "primary",
  },
  {
    href: "/app/bob/pods",
    label: "Pods",
    iconKey: "pods",
    permission: "pods.view",
    section: "primary",
  },
  {
    href: "/app/bob/attendance",
    label: "Attendance",
    iconKey: "attendance",
    permission: "attendance.view",
    section: "primary",
  },
  {
    href: "/app/bob/deliverables",
    label: "Deliverables",
    iconKey: "milestones",
    permission: "milestones.view",
    section: "primary",
  },
  {
    href: "/app/bob/inbox",
    label: "Submissions",
    iconKey: "inbox",
    permission: "inbox.view",
    section: "more",
  },
  {
    href: "/app/bob/submit",
    label: "Submit",
    iconKey: "submit",
    permission: "submit.view",
    section: "more",
  },
  {
    href: "/app/bob/settings",
    label: "Settings",
    iconKey: "settings",
    permission: "settings.view",
    section: "more",
  },
  {
    href: "/app/bob/staff",
    label: "Staff",
    iconKey: "staff",
    permission: "staff.view",
    section: "more",
  },
];
