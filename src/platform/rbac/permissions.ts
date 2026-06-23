import type { BobOpsRole } from "./types";

/**
 * Fine-grained permissions for BoB UI and actions.
 * Role matrix follows FY26 ops whiteboard:
 *   Leadership (admin) — all
 *   Support Squad (site_supporter + fellow) — all except intake; 2 tracks
 *   Coaches — all except intake & track assignment; 1 track
 *   Students — own profile, submit forms, limited dashboard
 */
export const BOB_PERMISSIONS = {
  "dashboard.view": "View command center",
  "dashboard.reports": "View program reports tab",
  "roster.view": "View student roster",
  "roster.create": "Create roster records",
  "roster.edit": "Edit roster records",
  "roster.editSelf": "Edit own roster profile only",
  "intake.view": "View recruitment / intake pipeline",
  "intake.edit": "Edit intake records",
  "pods.view": "View tracks list",
  "pods.viewAll": "View all tracks (org-wide)",
  "pods.create": "Create pods",
  "pods.edit": "Edit track assignments",
  "attendance.view": "View attendance",
  "attendance.mark": "Mark and edit attendance records",
  "attendance.discrepancies": "Review attendance correction triage queue",
  "milestones.view": "View deliverables",
  "milestones.edit": "Edit deliverables",
  "inbox.view": "View operations inbox",
  "inbox.notificationsAll": "See org-wide notifications",
  "notes.viewStaff": "View and add staff coach notes",
  "myPod.view": "View my pod workspace",
  "submit.view": "Submit operational forms",
  "keyLinks.view": "View key links and program resources",
  "teams.view": "View teams workspace (coming soon)",
  "staff.view": "View staff directory",
  "settings.view": "Open settings page",
  "settings.manage": "Run imports, sync, pipeline reset",
  "airtable.sync": "Trigger Airtable sync",
  "drawer.studentDetail": "Open student detail drawer",
  "drawer.intakeDetail": "Open intake detail drawer",
  "drawer.podDetail": "Open track detail drawer",
  "action.studentTransfer": "Transfer students between tracks",
  "action.studentDelete": "Delete student records",
} as const;

export type BobPermissionId = keyof typeof BOB_PERMISSIONS;

const ALL = Object.keys(BOB_PERMISSIONS) as BobPermissionId[];

function pick(...ids: BobPermissionId[]): Set<BobPermissionId> {
  return new Set(ids);
}

/** Leadership — full program access */
const ADMIN = pick(...ALL);

/** Program leadership (org-wide ops, no destructive admin settings by default) */
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
  "notes.viewStaff",
  "submit.view",
  "keyLinks.view",
  "teams.view",
  "staff.view",
  "drawer.studentDetail",
  "drawer.intakeDetail",
  "drawer.podDetail",
  "action.studentTransfer",
);

/**
 * Support Squad (site supporter + fellow) — all except intake; oversee up to 2 tracks.
 * Attendance reports, deliverables, blitz accountability, roster, incident response.
 */
const SITE_SUPPORTER = pick(
  "dashboard.view",
  "roster.view",
  "roster.edit",
  "pods.view",
  "attendance.view",
  "attendance.mark",
  "attendance.discrepancies",
  "milestones.view",
  "milestones.edit",
  "inbox.view",
  "notes.viewStaff",
  "submit.view",
  "keyLinks.view",
  "drawer.studentDetail",
  "drawer.podDetail",
);

/**
 * Coaches — deliverables & attendance for their track; no intake or track assignment.
 */
const COACH = pick(
  "dashboard.view",
  "roster.view",
  "attendance.view",
  "attendance.mark",
  "milestones.view",
  "inbox.view",
  "notes.viewStaff",
  "myPod.view",
  "submit.view",
  "keyLinks.view",
  "drawer.studentDetail",
  "drawer.podDetail",
);

/**
 * Students — personalized dashboard, roster (view all / edit self), team deliverables, youth key links.
 * No org inbox or staff notes.
 */
const STUDENT = pick(
  "dashboard.view",
  "roster.view",
  "roster.editSelf",
  "attendance.view",
  "milestones.view",
  "submit.view",
  "keyLinks.view",
  "drawer.studentDetail",
);

const READ_ONLY = pick("dashboard.view");

/** Role → granted permission set (static matrix; extend for ABAC later). */
export const ROLE_PERMISSIONS: Record<BobOpsRole, Set<BobPermissionId>> = {
  admin: ADMIN,
  program_manager: PROGRAM_MANAGER,
  site_supporter: SITE_SUPPORTER,
  coach: COACH,
  student: STUDENT,
  read_only: READ_ONLY,
};

export function roleHasPermission(
  role: BobOpsRole,
  permission: BobPermissionId,
): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
