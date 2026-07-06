import type { BobStaffMember, BobStaffRosterRow } from "@/platform/api/bob/staff";

const LEADERSHIP_ROLES = new Set(["admin", "program_manager"]);

const TRACK_STAFF_ROLES = new Set(["coach", "site_supporter", "fellow"]);

function normalizeTrackKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function rosterTracks(row: BobStaffRosterRow) {
  return [...row.tracksAsCoach, ...row.tracksAsSiteSupporter];
}

function rowMatchesStudentTrack(
  row: BobStaffRosterRow,
  studentTrack: string | null,
  studentPodId: string | null,
) {
  const tracks = rosterTracks(row);
  if (studentPodId && tracks.some((t) => t.id === studentPodId)) return true;
  if (!studentTrack) return false;
  const key = normalizeTrackKey(studentTrack);
  return tracks.some((t) => {
    const name = normalizeTrackKey(t.name);
    return name === key || name.includes(key) || key.includes(name);
  });
}

function isLeadershipRole(role: string | null | undefined) {
  return LEADERSHIP_ROLES.has(String(role || "").toLowerCase());
}

function isTrackStaffRole(role: string | null | undefined) {
  return TRACK_STAFF_ROLES.has(String(role || "").toLowerCase());
}

/**
 * Leadership team plus coaches / fellows / site supporters on the student's track.
 */
export function filterAssignableStaffForSubmission(
  staff: BobStaffMember[],
  roster: BobStaffRosterRow[],
  studentTrack: string | null,
  studentPodId: string | null,
): BobStaffMember[] {
  if (!studentTrack && !studentPodId) return staff;

  const rosterById = new Map(
    roster
      .filter((r) => r.hasAccount && !r.id.startsWith("email:"))
      .map((r) => [r.id, r]),
  );

  return staff.filter((member) => {
    const row = rosterById.get(member.id);
    const role = row?.bobRole ?? member.bobRole;
    if (isLeadershipRole(role)) return true;
    if (!isTrackStaffRole(role)) return false;
    if (!row) return false;
    return rowMatchesStudentTrack(row, studentTrack, studentPodId);
  });
}

/** Keep the current assignee visible even when outside the filtered list. */
export function assigneeSelectOptions(
  filtered: BobStaffMember[],
  assignedTo: string | null,
  assignedToLabel: string | null,
): BobStaffMember[] {
  if (!assignedTo || filtered.some((s) => s.id === assignedTo)) {
    return filtered;
  }
  return [
    {
      id: assignedTo,
      email: null,
      name: assignedToLabel,
      bobRole: "assigned",
      assignableRef: assignedTo,
    },
    ...filtered,
  ];
}
