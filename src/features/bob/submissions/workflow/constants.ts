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
  wellness_check: "Wellness Check",
  blitz_points: "Blitz Points",
  anonymous_feedback: "Anonymous Feedback",
  progress_update: "Progress Update",
  parent_contact: "Parent Contact",
};

export const ROUTING_HINTS: Partial<Record<BobSubmissionType, string>> = {
  incident: "High severity → Program Manager; otherwise pod coach",
  wellness_check: "Concern level escalates to Coach + Program Manager",
  parent_contact: "Routed to pod coach",
  blitz_points: "Auto-completes; triggers leaderboard recalculation",
  anonymous_feedback: "Routed to Program Manager",
  progress_update: "Routed to pod coach when student is linked",
};

export const SEVERITY_OPTIONS = ["low", "medium", "high"] as const;
export const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;
