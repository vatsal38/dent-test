import type { BobOpsRole } from "./types";

/**
 * Fine-grained permissions for BoB UI and actions.
 * Add new keys here and in `ROLE_PERMISSIONS` — avoid role checks in components.
 */
export const BOB_PERMISSIONS = {
  "dashboard.view": "View command center",
  "dashboard.reports": "View program reports tab",
  "roster.view": "View student roster",
  "roster.create": "Create roster records",
  "roster.edit": "Edit roster records",
  "intake.view": "View recruitment / intake pipeline",
  "intake.edit": "Edit intake records",
  "pods.view": "View pods list",
  "pods.viewAll": "View all pods (org-wide)",
  "pods.create": "Create pods",
  "pods.edit": "Edit pod assignments",
  "attendance.view": "View attendance",
  "attendance.mark": "Mark attendance",
  "attendance.discrepancies": "View attendance discrepancies",
  "milestones.view": "View milestones",
  "milestones.edit": "Edit milestones",
  "inbox.view": "View operations inbox",
  "inbox.notificationsAll": "See org-wide notifications",
  "myPod.view": "View my pod workspace",
  "submit.view": "Submit operational forms",
  "staff.view": "View staff directory",
  "settings.view": "Open settings page",
  "settings.manage": "Run imports, sync, pipeline reset",
  "airtable.sync": "Trigger Airtable sync",
  "drawer.studentDetail": "Open student detail drawer",
  "drawer.intakeDetail": "Open intake detail drawer",
  "drawer.podDetail": "Open pod detail drawer",
  "action.studentTransfer": "Transfer students between pods",
  "action.studentDelete": "Delete student records",
} as const;

export type BobPermissionId = keyof typeof BOB_PERMISSIONS;

const ALL = Object.keys(BOB_PERMISSIONS) as BobPermissionId[];

function pick(...ids: BobPermissionId[]): Set<BobPermissionId> {
  return new Set(ids);
}

const ADMIN = pick(...ALL);

const PROGRAM_MANAGER = pick(
  "dashboard.view",
  "dashboard.reports",
  "roster.view",
  "roster.create",
  "roster.edit",
  "intake.view",
  "intake.edit",
  "pods.view",
  "pods.viewAll",
  "pods.create",
  "pods.edit",
  "attendance.view",
  "attendance.mark",
  "attendance.discrepancies",
  "milestones.view",
  "milestones.edit",
  "inbox.view",
  "inbox.notificationsAll",
  "submit.view",
  "staff.view",
  "drawer.studentDetail",
  "drawer.intakeDetail",
  "drawer.podDetail",
  "action.studentTransfer",
);

const SITE_SUPPORTER = pick(
  "dashboard.view",
  "roster.view",
  "attendance.view",
  "attendance.mark",
  "attendance.discrepancies",
  "inbox.view",
  "submit.view",
  "drawer.studentDetail",
  "drawer.podDetail",
);

const COACH = pick(
  "dashboard.view",
  "roster.view",
  "milestones.view",
  "inbox.view",
  "myPod.view",
  "submit.view",
  "drawer.studentDetail",
  "drawer.podDetail",
);

const READ_ONLY = pick("dashboard.view");

/** Role → granted permission set (static matrix; extend for ABAC later). */
export const ROLE_PERMISSIONS: Record<BobOpsRole, Set<BobPermissionId>> = {
  admin: ADMIN,
  program_manager: PROGRAM_MANAGER,
  site_supporter: SITE_SUPPORTER,
  coach: COACH,
  read_only: READ_ONLY,
};

export function roleHasPermission(
  role: BobOpsRole,
  permission: BobPermissionId,
): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
