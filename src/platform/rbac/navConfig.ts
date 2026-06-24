import { BOB_MY_POD, BOB_POD_PLURAL } from "@/lib/bobDisplayTerminology";
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
    | "keyLinks"
    | "teams"
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
    label: BOB_MY_POD,
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
    label: BOB_POD_PLURAL,
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
    href: "/app/bob/teams",
    label: "Project teams",
    iconKey: "teams",
    permission: "teams.view",
    section: "primary",
    after: "/app/bob/deliverables",
  },
  {
    href: "/app/bob/key-links",
    label: "Key Links",
    iconKey: "keyLinks",
    permission: "keyLinks.view",
    section: "primary",
    after: "/app/bob/deliverables",
  },
  {
    href: "/app/bob/inbox",
    label: "Submissions",
    iconKey: "inbox",
    permission: "inbox.view",
    section: "primary",
    after: "/app/bob/key-links",
  },
  {
    href: "/app/bob/submit",
    label: "Submit",
    iconKey: "submit",
    permission: "submit.view",
    section: "primary",
    after: "/app/bob/inbox",
  },
  {
    href: "/app/bob/staff",
    label: "Staff",
    iconKey: "staff",
    permission: "staff.view",
    section: "primary",
    after: "/app/bob/submit",
  },
  {
    href: "/app/bob/settings",
    label: "Settings",
    iconKey: "settings",
    permission: "settings.view",
    section: "more",
  },
];
