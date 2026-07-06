import {
  BOB_KANBAN_STATUSES,
  BOB_SUBMISSION_STATUSES,
  BOB_SUBMISSION_TYPES,
  type BobSubmissionStatus,
  type BobSubmissionType,
} from "@/platform/api/bob/submissions";

export { BOB_KANBAN_STATUSES, BOB_SUBMISSION_STATUSES, BOB_SUBMISSION_TYPES };

export const SUBMISSION_STATUS_LABELS: Record<BobSubmissionStatus, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In Progress",
  waiting: "Waiting",
  done: "Done",
  archived: "Archived",
};

export const SUBMISSION_TYPE_LABELS: Record<BobSubmissionType, string> = {
  incident: "Incident Report",
  wellness_check: "Weekly Check-in",
  blitz_points: "Blitz Points",
  anonymous_feedback: "Feedback",
  progress_update: "Progress Update",
  parent_contact: "Parent Contact",
  pto_request: "PTO Request",
  purchase_request: "Purchase Request",
  reimbursement_request: "Reimbursement",
  photo_upload: "Photo Album",
  coach_feedback: "Weekly Coach Feedback",
  dent_testimony: "Dent Testimony",
  attendance_correction: "Absence & sign in/out correction",
};

export const ROUTING_HINTS: Partial<Record<BobSubmissionType, string>> = {
  incident: "High severity → Program Manager; otherwise track site supporter",
  wellness_check: "Scores 1–4 escalate to leadership; weekly check-in per student",
  parent_contact: "Routed to pod coach",
  blitz_points: "Auto-completes; triggers leaderboard recalculation",
  anonymous_feedback: "Routed to Micky Wolf; submitter hidden when anonymous",
  progress_update: "Routed to pod coach when student is linked",
  pto_request: "Visible to leadership and Support Squad only",
  purchase_request: "Routed to Support Squad with leadership copied",
  reimbursement_request: "Routed to finance lead (Micky)",
  photo_upload: "Routed to Support Squad for album processing",
  coach_feedback: "Weekly survey routed to program leadership",
  dent_testimony: "Routed to pod coach with program leadership notified",
  attendance_correction:
    "Routed to pod coach; appears in Submissions inbox with incidents",
};

export const SEVERITY_OPTIONS = ["low", "medium", "high"] as const;
export const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

const LEVEL_LABELS: Record<(typeof PRIORITY_OPTIONS)[number], string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

/** Display priority / severity as uppercase (LOW, MEDIUM, HIGH). */
export function levelLabel(value: string | null | undefined): string {
  if (!value) return "";
  const key = value.toLowerCase() as (typeof PRIORITY_OPTIONS)[number];
  return LEVEL_LABELS[key] ?? value.toUpperCase();
}
