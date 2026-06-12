import type { BobDeliverable } from "@/platform/api/bob/milestones";

export const TRACK_FILTERS = [
  { id: "", label: "All tracks" },
  { id: "Made@Dent", label: "Made@Dent" },
  { id: "Denternship", label: "Denternship" },
  { id: "Accelerate Your Dent", label: "AYD" },
  { id: "Content Creation", label: "Content Creation & Marketing" },
] as const;

export const REVIEW_STATUS_OPTIONS = [
  { value: "", label: "—" },
  { value: "pending_review", label: "Pending review" },
  { value: "in_progress", label: "In progress" },
  { value: "approved", label: "Approved" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "not_started", label: "Not started" },
] as const;

export const TRACKER_STATUS_OPTIONS = [
  { value: "Not Started", label: "Not Started" },
  { value: "In Progress, On Track", label: "In Progress, On Track" },
  { value: "Behind", label: "Behind" },
  { value: "Completed", label: "Completed" },
  { value: "Not Completed - Program Done", label: "Not Completed" },
] as const;

export const TRACKER_TO_APP_REVIEW: Record<string, string> = {
  "Not Started": "not_started",
  "In Progress, On Track": "in_progress",
  Behind: "changes_requested",
  Completed: "approved",
  "Not Completed - Program Done": "not_completed",
};

export const APP_REVIEW_TO_TRACKER: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress, On Track",
  changes_requested: "Behind",
  approved: "Completed",
  pending_review: "In Progress, On Track",
  not_completed: "Not Completed - Program Done",
};

export function reviewStatusBadge(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-green-100 text-green-800" };
    case "changes_requested":
      return { label: "Changes requested", className: "bg-red-100 text-red-800" };
    case "in_progress":
      return { label: "In progress", className: "bg-blue-100 text-blue-800" };
    case "not_started":
      return { label: "Not started", className: "bg-gray-100 text-gray-700" };
    case "pending_review":
    default:
      return { label: "Pending review", className: "bg-amber-100 text-amber-900" };
  }
}

export function progressStatusBadge(status: string | null | undefined) {
  if (!status) return { label: "—", className: "bg-gray-100 text-gray-600" };
  if (/complete/i.test(status)) {
    return { label: status, className: "bg-green-100 text-green-800" };
  }
  if (/behind/i.test(status)) {
    return { label: status, className: "bg-red-100 text-red-800" };
  }
  if (/on track/i.test(status)) {
    return { label: status, className: "bg-blue-100 text-blue-800" };
  }
  return { label: status, className: "bg-gray-100 text-gray-700" };
}

export function formatDeliverableDates(d: BobDeliverable) {
  const start = d.plannedStartDate;
  const end = d.targetCompletionDate;
  if (start && end) return `${start} → ${end}`;
  return end || start || "—";
}

export function pendingUploadCount(d: BobDeliverable) {
  return (d.trackerRecords || []).filter(
    (t) => t.uploads?.length && t.reviewStatus !== "approved",
  ).length;
}
