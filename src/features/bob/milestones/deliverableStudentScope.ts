import type { BobDeliverable } from "@/platform/api/bob/milestones";
import type { BobStudent } from "@/platform/api/bob/students";
import type { BobProjectTeam } from "@/platform/api/bob/projectTeams";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";
import { resolveStudentTrackLabel } from "@/lib/bobRosterTrackOptions";
import { deliverableAppliesToTeam } from "./deliverableTeamReview";

export function projectTeamsForStudent(
  student: BobStudent,
  teams: BobProjectTeam[],
): BobProjectTeam[] {
  const studentAirtableId = String(student.airtableRecordId || "").trim();
  return teams.filter((team) =>
    team.members.some(
      (m) =>
        m.studentId === student.id ||
        (studentAirtableId && m.airtableRecordId === studentAirtableId),
    ),
  );
}

export function studentProjectTeamNames(
  student: BobStudent,
  teams: BobProjectTeam[],
): string[] {
  return [...new Set(projectTeamsForStudent(student, teams).map((t) => t.name))];
}

/** Deliverables that apply to this student — by project team first, then track. */
export function deliverableAppliesToStudent(
  deliverable: BobDeliverable,
  student: BobStudent,
  teams: BobProjectTeam[] = [],
): boolean {
  const studentAirtableId = String(student.airtableRecordId || "").trim();
  if (
    studentAirtableId &&
    (deliverable.studentAirtableIds || []).map(String).includes(studentAirtableId)
  ) {
    return true;
  }

  const teamNames = studentProjectTeamNames(student, teams);
  if (teamNames.length) {
    return teamNames.some((name) => deliverableAppliesToTeam(deliverable, name));
  }

  const track = formatBobTrackDisplayLabel(
    resolveStudentTrackLabel(student),
  ).toLowerCase();
  const dTrack = formatBobTrackDisplayLabel(
    deliverable.trackName || "",
  ).toLowerCase();
  if (!track || track === "unassigned" || !dTrack) return false;
  return dTrack.includes(track) || track.includes(dTrack);
}

export function filterDeliverablesForStudent(
  deliverables: BobDeliverable[],
  student: BobStudent,
  teams: BobProjectTeam[] = [],
): BobDeliverable[] {
  return deliverables.filter((d) =>
    deliverableAppliesToStudent(d, student, teams),
  );
}
