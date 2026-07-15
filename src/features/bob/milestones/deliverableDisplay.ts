import type { BobDeliverable } from "@/platform/api/bob/milestones";

export type DeliverableTrackStats = {
  trackName: string;
  dueCount: number;
  submittedCount: number;
  completedCount: number;
  overdueCount: number;
  pctDueSubmitted: number;
  pctDueCompleted: number;
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isDeliverableDue(
  deliverable: BobDeliverable,
  today: string = todayIso(),
): boolean {
  const due = String(deliverable.targetCompletionDate || "").slice(0, 10);
  if (!due) return false;
  return due <= today;
}

export function isDeliverableCompleted(deliverable: BobDeliverable): boolean {
  if (deliverable.milestoneComplete) return true;
  if (deliverable.reviewStatus === "approved") return true;
  return (deliverable.trackerRecords || []).some(
    (t) => String(t.deliverableStatus || "") === "Completed",
  );
}

export function isDeliverableSubmitted(deliverable: BobDeliverable): boolean {
  if (isDeliverableCompleted(deliverable)) return true;
  if (
    deliverable.reviewStatus &&
    !["not_started", "pending_review"].includes(deliverable.reviewStatus)
  ) {
    return true;
  }
  return (deliverable.trackerRecords || []).some((t) => {
    const status = String(t.deliverableStatus || "");
    return status && status !== "Not Started";
  });
}

export function isDeliverableOverdue(
  deliverable: BobDeliverable,
  today: string = todayIso(),
): boolean {
  const due = String(deliverable.targetCompletionDate || "").slice(0, 10);
  if (!due || due >= today) return false;
  return !isDeliverableCompleted(deliverable);
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function computeDeliverableTrackStats(
  deliverables: BobDeliverable[],
  today: string = todayIso(),
): DeliverableTrackStats[] {
  const byTrack = new Map<string, BobDeliverable[]>();
  for (const d of deliverables) {
    const key = d.trackName || "Other";
    if (!byTrack.has(key)) byTrack.set(key, []);
    byTrack.get(key)!.push(d);
  }

  return [...byTrack.entries()]
    .map(([trackName, items]) => {
      const dueItems = items.filter((d) => isDeliverableDue(d, today));
      const submittedCount = dueItems.filter(isDeliverableSubmitted).length;
      const completedCount = dueItems.filter(isDeliverableCompleted).length;
      const overdueCount = dueItems.filter((d) =>
        isDeliverableOverdue(d, today),
      ).length;
      return {
        trackName,
        dueCount: dueItems.length,
        submittedCount,
        completedCount,
        overdueCount,
        pctDueSubmitted: pct(submittedCount, dueItems.length),
        pctDueCompleted: pct(completedCount, dueItems.length),
      };
    })
    .sort((a, b) => a.trackName.localeCompare(b.trackName));
}

export function computeOverallDeliverableStats(
  deliverables: BobDeliverable[],
  today: string = todayIso(),
): Omit<DeliverableTrackStats, "trackName"> {
  const dueItems = deliverables.filter((d) => isDeliverableDue(d, today));
  const submittedCount = dueItems.filter(isDeliverableSubmitted).length;
  const completedCount = dueItems.filter(isDeliverableCompleted).length;
  const overdueCount = dueItems.filter((d) =>
    isDeliverableOverdue(d, today),
  ).length;
  return {
    dueCount: dueItems.length,
    submittedCount,
    completedCount,
    overdueCount,
    pctDueSubmitted: pct(submittedCount, dueItems.length),
    pctDueCompleted: pct(completedCount, dueItems.length),
  };
}

export const TRACK_FILTERS = [
  { id: "", label: "All tracks" },
  { id: "Made@Dent", label: "Made@Dent" },
  { id: "Denternship", label: "Denternship" },
  { id: "Accelerate Your Dent", label: "AYD" },
  { id: "Content Creation", label: "Content Creation & Marketing" },
] as const;

export const REVIEW_STATUS_OPTIONS = [
  { value: "", label: "—" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "pending_review", label: "Pending Review" },
  { value: "changes_requested", label: "Needs Student Work" },
  { value: "approved", label: "Completed" },
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
  // Do not force Airtable into "In Progress" for awaiting-review state
  pending_review: "Not Started",
  not_completed: "Not Completed - Program Done",
};

export function reviewStatusBadge(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return { label: "Completed", className: "bg-green-100 text-green-800" };
    case "changes_requested":
      return {
        label: "Needs Student Work",
        className: "bg-red-100 text-red-800",
      };
    case "not_started":
      return { label: "Not started", className: "bg-gray-100 text-gray-800" };
    case "in_progress":
      return { label: "In progress", className: "bg-blue-100 text-blue-800" };
    case "pending_review":
      return {
        label: "Pending Review",
        className: "bg-amber-100 text-amber-900",
      };
    default:
      // Blank / unknown statuses default to Not started (never inferred from deadlines)
      return { label: "Not started", className: "bg-gray-100 text-gray-800" };
  }
}

/**
 * Portfolio badge for the student drawer (ticket 40B).
 * Prefer coach review / tracker status — do not show a vague "Submitted"
 * just because upload rows exist.
 */
export function portfolioStatusBadge(deliverable: BobDeliverable): {
  label: string;
  className: string;
  title: string;
} {
  if (isDeliverableCompleted(deliverable)) {
    return {
      ...reviewStatusBadge("approved"),
      title: "Coach marked this deliverable complete",
    };
  }

  const uploadCount = (deliverable.trackerRecords || []).reduce(
    (n, t) => n + (t.uploads?.length || 0),
    0,
  );
  const trackerStatus = (deliverable.trackerRecords || [])
    .map((t) => String(t.deliverableStatus || "").trim())
    .find(Boolean);
  if (trackerStatus) {
    const mapped = TRACKER_TO_APP_REVIEW[trackerStatus];
    if (mapped) {
      const badge = reviewStatusBadge(mapped);
      return {
        ...badge,
        title: uploadCount
          ? `${trackerStatus} · ${uploadCount} file${uploadCount === 1 ? "" : "s"} on file`
          : trackerStatus,
      };
    }
    return {
      label: trackerStatus,
      className: "bg-blue-100 text-blue-800",
      title: uploadCount
        ? `${uploadCount} file${uploadCount === 1 ? "" : "s"} on file`
        : "Tracker status from Airtable",
    };
  }

  const review = reviewStatusBadge(deliverable.reviewStatus);
  if (uploadCount > 0 && (!deliverable.reviewStatus || deliverable.reviewStatus === "not_started")) {
    return {
      label: "Files uploaded",
      className: "bg-blue-100 text-blue-800",
      title: `${uploadCount} file${uploadCount === 1 ? "" : "s"} on file — awaiting coach review`,
    };
  }
  return {
    ...review,
    title: uploadCount
      ? `${review.label} · ${uploadCount} file${uploadCount === 1 ? "" : "s"} on file`
      : "Coach review status for this deliverable",
  };
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
