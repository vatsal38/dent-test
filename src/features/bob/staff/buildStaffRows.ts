import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";

export type StaffRow = {
  id: string;
  label: string;
  roles: ("Coach" | "Track supporter" | "Coach (student)")[];
  podIdsAsCoach: string[];
  podIdsAsSiteSupporter: string[];
  studentIds: string[];
};

export function buildStaffRows(
  pods: BobPod[],
  students: BobStudent[],
): StaffRow[] {
  const byId = new Map<string, StaffRow>();

  function getOrCreate(
    id: string,
    label: string,
    role: "Coach" | "Track supporter" | "Coach (student)",
  ) {
    let row = byId.get(id);
    if (!row) {
      row = {
        id,
        label,
        roles: [],
        podIdsAsCoach: [],
        podIdsAsSiteSupporter: [],
        studentIds: [],
      };
      byId.set(id, row);
    }
    if (!row.roles.includes(role)) row.roles.push(role);
    return row;
  }

  for (const p of pods) {
    const coaches = p.coachIds?.length
      ? p.coachIds
      : p.coachId
        ? [p.coachId]
        : [];
    for (const coachId of coaches) {
      const row = getOrCreate(coachId, coachId, "Coach");
      if (!row.podIdsAsCoach.includes(p.id)) {
        row.podIdsAsCoach.push(p.id);
      }
    }
    if (p.siteSupporterId && p.siteSupporterId !== p.coachId) {
      const row = getOrCreate(p.siteSupporterId, p.siteSupporterId, "Track supporter");
      row.podIdsAsSiteSupporter.push(p.id);
    } else if (p.siteSupporterId) {
      const row = getOrCreate(p.siteSupporterId, p.siteSupporterId, "Track supporter");
      if (!row.podIdsAsSiteSupporter.includes(p.id)) {
        row.podIdsAsSiteSupporter.push(p.id);
      }
    }
  }

  for (const s of students) {
    const coachName = (s.coach || "").trim();
    if (!coachName) continue;
    const id = `name:${coachName}`;
    const row = getOrCreate(id, coachName, "Coach (student)");
    row.studentIds.push(s.id);
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
