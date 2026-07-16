import type {
  BobDeliverable,
  BobDeliverableTrackerRecord,
} from "@/platform/api/bob/milestones";

/** Display label: "Jay's Water | Denternship" → "Jay's Water" */
export function shortProjectTeamName(name: string | null | undefined): string {
  const s = String(name || "").trim();
  if (!s) return "";
  return s.split("|")[0]?.trim() || s;
}

export function teamNameFromProjectDeliverable(
  value: string | null | undefined,
): string {
  const parts = String(value || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] || "";
}

function teamNamesMatch(a: string, b: string): boolean {
  const left = shortProjectTeamName(a).toLowerCase();
  const right = shortProjectTeamName(b).toLowerCase();
  if (!left || !right) return false;
  return left === right || a.toLowerCase().includes(right) || b.toLowerCase().includes(left);
}

export function findTrackerForTeam(
  deliverable: BobDeliverable,
  teamName?: string,
): BobDeliverableTrackerRecord | null {
  if (!teamName) return deliverable.trackerRecords?.[0] ?? null;
  const trackers = deliverable.trackerRecords || [];
  const exact = trackers.find((t) =>
    (t.teamNames || []).some((n) => teamNamesMatch(n, teamName)),
  );
  if (exact) return exact;
  const fuzzy = trackers.find((t) =>
    teamNamesMatch(
      teamNameFromProjectDeliverable(t.projectDeliverable),
      teamName,
    ),
  );
  if (fuzzy) return fuzzy;
  const fuzzyPd = trackers.find((t) =>
    String(t.projectDeliverable || "")
      .toLowerCase()
      .includes(shortProjectTeamName(teamName).toLowerCase()),
  );
  return fuzzyPd ?? null;
}

export function teamReviewStatus(
  deliverable: BobDeliverable,
  teamName?: string,
): string {
  // Catalog / no team: templates stay Not started — never roll up a team or
  // treat a past deadline as started/pending.
  if (!teamName) return "not_started";

  const tracker = findTrackerForTeam(deliverable, teamName);
  const hasUploads = Boolean(tracker?.uploads?.length);
  // Blank tracker / default pending_review with no files → not started
  if (
    tracker &&
    !tracker.deliverableStatus &&
    (!tracker.reviewStatus ||
      tracker.reviewStatus === "pending_review" ||
      tracker.reviewStatus === "not_started")
  ) {
    return hasUploads ? "pending_review" : "not_started";
  }
  if (tracker?.deliverableStatus === "Completed") return "approved";
  if (tracker?.deliverableStatus === "Behind") return "changes_requested";
  if (tracker?.deliverableStatus === "In Progress, On Track") {
    return "in_progress";
  }
  if (tracker?.deliverableStatus === "Not Started") {
    return hasUploads ? "pending_review" : "not_started";
  }
  if (tracker?.reviewStatus) {
    if (
      tracker.reviewStatus === "pending_review" &&
      !hasUploads
    ) {
      return "not_started";
    }
    return tracker.reviewStatus;
  }
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
    for (const t of d.teamNames || []) {
      const short = shortProjectTeamName(t);
      if (short) names.add(short);
    }
    for (const t of d.projectNames || []) {
      const short = shortProjectTeamName(t);
      if (short) names.add(short);
    }
    for (const row of d.trackerRecords || []) {
      for (const t of row.teamNames || []) {
        const short = shortProjectTeamName(t);
        if (short) names.add(short);
      }
      const fromPd = teamNameFromProjectDeliverable(row.projectDeliverable);
      if (fromPd) names.add(fromPd);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function deliverableAppliesToTeam(
  deliverable: BobDeliverable,
  teamName: string,
): boolean {
  if (deliverable.teamNames?.some((n) => teamNamesMatch(n, teamName))) {
    return true;
  }
  if (deliverable.projectNames?.some((n) => teamNamesMatch(n, teamName))) {
    return true;
  }
  return (deliverable.trackerRecords || []).some(
    (t) =>
      (t.teamNames || []).some((n) => teamNamesMatch(n, teamName)) ||
      teamNamesMatch(teamNameFromProjectDeliverable(t.projectDeliverable), teamName),
  );
}

export function teamTrackerSummaries(
  deliverable: BobDeliverable,
): Array<{ teamName: string; tracker: BobDeliverableTrackerRecord | null }> {
  const teams = new Set<string>();
  for (const name of deliverable.teamNames || []) {
    const short = shortProjectTeamName(name);
    if (short) teams.add(short);
  }
  for (const name of deliverable.projectNames || []) {
    const short = shortProjectTeamName(name);
    if (short) teams.add(short);
  }
  for (const row of deliverable.trackerRecords || []) {
    for (const name of row.teamNames || []) {
      const short = shortProjectTeamName(name);
      if (short) teams.add(short);
    }
    const fromPd = teamNameFromProjectDeliverable(row.projectDeliverable);
    if (fromPd) teams.add(fromPd);
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

export function teamDeliverableNeedsReview(
  deliverable: BobDeliverable,
  teamName: string,
  progressReviewKeys?: Set<string>,
): boolean {
  if (teamPendingUploadCount(deliverable, teamName) > 0) return true;
  const status = teamReviewStatus(deliverable, teamName);
  if (status === "pending_review") return true;
  // Flag when youth submitted a weekly progress update for this team/deliverable
  if (progressReviewKeys?.size) {
    const short = shortProjectTeamName(teamName);
    if (progressReviewKeys.has(`${deliverable.id}|${short}`)) {
      // Already staff-approved — don't keep in queue
      if (status === "approved") return false;
      return true;
    }
  }
  return false;
}

export function listTeamDeliverablesNeedingReview(
  deliverables: BobDeliverable[],
  allowedTeamNames?: string[],
  progressReviewKeys?: Set<string>,
): Array<{ deliverable: BobDeliverable; teamName: string }> {
  const out: Array<{ deliverable: BobDeliverable; teamName: string }> = [];
  if (allowedTeamNames !== undefined && allowedTeamNames.length === 0) {
    return out;
  }
  for (const d of deliverables) {
    const teams = new Set(teamNamesFromDeliverables([d]));
    // Progress updates may name teams not yet on tracker rows — include them
    if (progressReviewKeys?.size) {
      for (const key of progressReviewKeys) {
        const prefix = `${d.id}|`;
        if (!key.startsWith(prefix)) continue;
        const team = key.slice(prefix.length);
        if (team) teams.add(team);
      }
    }
    for (const team of teams) {
      if (
        allowedTeamNames?.length &&
        !allowedTeamNames.some((allowed) => teamNamesMatch(team, allowed))
      ) {
        continue;
      }
      if (teamDeliverableNeedsReview(d, team, progressReviewKeys)) {
        out.push({ deliverable: d, teamName: team });
      }
    }
  }
  out.sort((a, b) => {
    const na = a.deliverable.deliverableNumber || "";
    const nb = b.deliverable.deliverableNumber || "";
    return na.localeCompare(nb, undefined, { numeric: true });
  });
  return out;
}

export function countTeamDeliverablesNeedingReview(
  deliverables: BobDeliverable[],
  allowedTeamNames?: string[],
  progressReviewKeys?: Set<string>,
): number {
  return listTeamDeliverablesNeedingReview(
    deliverables,
    allowedTeamNames,
    progressReviewKeys,
  ).length;
}

export function teamNameMatchesFilter(
  rowTeam: string,
  filter: string,
): boolean {
  if (!filter) return true;
  return teamNamesMatch(rowTeam, filter);
}
