import type {
  BobDeliverable,
  BobDeliverableTrackerRecord,
} from "@/platform/api/bob/milestones";

export function findTrackerForTeam(
  deliverable: BobDeliverable,
  teamName?: string,
): BobDeliverableTrackerRecord | null {
  if (!teamName) return deliverable.trackerRecords?.[0] ?? null;
  const trackers = deliverable.trackerRecords || [];
  const exact = trackers.find((t) => (t.teamNames || []).includes(teamName));
  if (exact) return exact;
  const fuzzy = trackers.find((t) =>
    String(t.projectDeliverable || "")
      .toLowerCase()
      .includes(teamName.toLowerCase()),
  );
  return fuzzy ?? null;
}

export function teamReviewStatus(
  deliverable: BobDeliverable,
  teamName?: string,
): string {
  const tracker = findTrackerForTeam(deliverable, teamName);
  if (tracker?.reviewStatus) return tracker.reviewStatus;
  if (tracker?.deliverableStatus === "Completed") return "approved";
  if (tracker?.deliverableStatus === "Behind") return "changes_requested";
  if (tracker?.deliverableStatus === "In Progress, On Track") {
    return "in_progress";
  }
  if (tracker?.deliverableStatus === "Not Started") return "not_started";
  if (!teamName) return deliverable.reviewStatus || "pending_review";
  return "not_started";
}

export function teamPendingUploadCount(
  deliverable: BobDeliverable,
  teamName?: string,
): number {
  const tracker = findTrackerForTeam(deliverable, teamName);
  if (!tracker?.uploads?.length) return 0;
  if (tracker.reviewStatus === "approved") return 0;
  return tracker.uploads.length;
}

export function teamNamesFromDeliverables(
  deliverables: BobDeliverable[],
): string[] {
  const names = new Set<string>();
  for (const d of deliverables) {
    for (const t of d.teamNames || []) names.add(t);
    for (const t of d.projectNames || []) names.add(t);
    for (const row of d.trackerRecords || []) {
      for (const t of row.teamNames || []) names.add(t);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function deliverableAppliesToTeam(
  deliverable: BobDeliverable,
  teamName: string,
): boolean {
  if (deliverable.teamNames?.includes(teamName)) return true;
  if (deliverable.projectNames?.includes(teamName)) return true;
  return (deliverable.trackerRecords || []).some((t) =>
    (t.teamNames || []).includes(teamName),
  );
}

export function teamTrackerSummaries(
  deliverable: BobDeliverable,
): Array<{ teamName: string; tracker: BobDeliverableTrackerRecord | null }> {
  const teams = new Set<string>();
  for (const name of deliverable.teamNames || []) teams.add(name);
  for (const name of deliverable.projectNames || []) teams.add(name);
  for (const row of deliverable.trackerRecords || []) {
    for (const name of row.teamNames || []) teams.add(name);
  }
  if (!teams.size) {
    return [{ teamName: "Unassigned", tracker: deliverable.trackerRecords?.[0] ?? null }];
  }
  return [...teams]
    .sort((a, b) => a.localeCompare(b))
    .map((teamName) => ({
      teamName,
      tracker: findTrackerForTeam(deliverable, teamName),
    }));
}
