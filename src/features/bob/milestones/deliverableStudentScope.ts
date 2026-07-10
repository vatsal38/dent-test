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
  const studentId = String(student.id || "").trim();
  const nameKeys = new Set(
    [
      [student.firstName, student.lastName].filter(Boolean).join(" "),
      [student.preferredName || student.firstName, student.lastName]
        .filter(Boolean)
        .join(" "),
      student.preferredName && student.firstName && student.lastName
        ? `${student.firstName} ${student.preferredName} ${student.lastName}`
        : "",
    ]
      .map((n) =>
        n
          .toLowerCase()
          .replace(/['’"‘]/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean),
  );

  return teams.filter((team) =>
    team.members.some((m) => {
      if (studentId && m.studentId === studentId) return true;
      if (
        studentAirtableId &&
        m.airtableRecordId &&
        m.airtableRecordId === studentAirtableId
      ) {
        return true;
      }
      const memberKey = String(m.name || "")
        .toLowerCase()
        .replace(/['’"‘]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!memberKey || !nameKeys.size) return false;
      if (nameKeys.has(memberKey)) return true;
      const memberTokens = memberKey.split(" ").filter(Boolean);
      for (const key of nameKeys) {
        const keyTokens = key.split(" ").filter(Boolean);
        if (
          memberTokens.length >= 2 &&
          keyTokens.length >= 2 &&
          memberTokens[0] === keyTokens[0] &&
          memberTokens[memberTokens.length - 1] ===
            keyTokens[keyTokens.length - 1]
        ) {
          return true;
        }
      }
      return false;
    }),
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
