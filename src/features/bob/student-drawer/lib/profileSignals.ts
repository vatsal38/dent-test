import type { BobStudent } from "@/platform/api/bob/students";
import type { BobSubmission } from "@/platform/api/bob/submissions";
import type { CoachNote, WellnessSignal } from "../types";

const NOTE_FIELD_CANDIDATES = [
  "Coach Notes",
  "Coach Note",
  "Notes",
  "Internal Notes",
  "Staff Notes",
  "Counselor Notes",
] as const;

export const INDUSTRY_CREDENTIAL_FIELD_NAMES = [
  "Industry Credential",
  "Industry Credentials",
  "Industry Certificate",
  "Has Industry Credential",
] as const;

function truthyFieldValue(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return (
      v === "yes" ||
      v === "true" ||
      v === "complete" ||
      v === "completed" ||
      v === "earned" ||
      v === "received"
    );
  }
  return false;
}

export function coachNoteFieldKey(
  student: BobStudent | undefined,
): string {
  const fields = (student?.airtableFields || {}) as Record<string, unknown>;
  for (const key of NOTE_FIELD_CANDIDATES) {
    if (key in fields) return key;
  }
  return NOTE_FIELD_CANDIDATES[0];
}

export function hasIndustryCredential(student: BobStudent | undefined): boolean {
  if (!student?.airtableFields) return false;
  const fields = student.airtableFields as Record<string, unknown>;
  for (const key of INDUSTRY_CREDENTIAL_FIELD_NAMES) {
    if (truthyFieldValue(fields[key])) return true;
  }
  for (const [key, value] of Object.entries(fields)) {
    if (/industry\s*credential/i.test(key) && truthyFieldValue(value)) {
      return true;
    }
  }
  return false;
}

export function extractCoachNotes(
  student: BobStudent | undefined,
): CoachNote[] {
  if (!student?.airtableFields) return [];
  const fields = student.airtableFields as Record<string, unknown>;
  const notes: CoachNote[] = [];

  for (const key of NOTE_FIELD_CANDIDATES) {
    const raw = fields[key];
    if (raw == null) continue;
    const body = String(raw).trim();
    if (!body) continue;
    notes.push({
      id: `field:${key}`,
      author: key.replace(/notes?/i, "").trim() || "Coach",
      body,
    });
  }
  return notes;
}

export function computeWellnessSignals(
  student: BobStudent | undefined,
  submissions: BobSubmission[] = [],
): WellnessSignal[] {
  const signals: WellnessSignal[] = [];
  if (!student) return signals;

  const absent = student.attendanceStats?.absent ?? 0;
  if (absent >= 3) {
    signals.push({
      id: "attendance-absent",
      label: "Attendance",
      level: "concern",
      detail: `${absent} absences on record`,
    });
  } else if (absent >= 1) {
    signals.push({
      id: "attendance-absent",
      label: "Attendance",
      level: "watch",
      detail: `${absent} absence${absent === 1 ? "" : "s"}`,
    });
  } else {
    signals.push({
      id: "attendance-absent",
      label: "Attendance",
      level: "good",
      detail: "No elevated absence pattern",
    });
  }

  const openWellness = submissions.filter(
    (s) =>
      s.type === "wellness_check" &&
      s.status !== "done" &&
      s.status !== "archived",
  );
  if (openWellness.length > 0) {
    signals.push({
      id: "wellness-open",
      label: "Wellness checks",
      level: "concern",
      detail: `${openWellness.length} open`,
    });
  }

  const openIncidents = submissions.filter(
    (s) =>
      s.type === "incident" &&
      s.status !== "done" &&
      s.status !== "archived",
  );
  if (openIncidents.length > 0) {
    signals.push({
      id: "incidents-open",
      label: "Incidents",
      level: openIncidents.some((s) => s.severity === "high")
        ? "concern"
        : "watch",
      detail: `${openIncidents.length} active`,
    });
  }

  const submitted = student.milestoneStats?.submitted ?? 0;
  const total = student.milestoneStats?.total ?? 0;
  if (total > 0 && submitted / total < 0.5) {
    signals.push({
      id: "milestones-behind",
      label: "Deliverables",
      level: "watch",
      detail: `${submitted}/${total} submitted`,
    });
  }

  if (student.status === "inactive" || student.status === "withdrawn") {
    signals.push({
      id: "status",
      label: "Enrollment",
      level: "watch",
      detail: student.status,
    });
  }

  return signals;
}

/** Simple 1–5 engagement score from operational signals (display only). */
export function computeEngagementRating(
  student: BobStudent | undefined,
  submissions: BobSubmission[] = [],
): { score: number; label: string } {
  if (!student) return { score: 0, label: "—" };

  let score = 4;
  const absent = student.attendanceStats?.absent ?? 0;
  if (absent >= 3) score -= 2;
  else if (absent >= 1) score -= 1;

  const openIncidents = submissions.filter(
    (s) => s.type === "incident" && !["done", "archived"].includes(s.status),
  ).length;
  if (openIncidents > 0) score -= 1;

  const m = student.milestoneStats;
  if (m?.total && (m.submitted ?? 0) / m.total < 0.4) score -= 1;

  if (student.status === "graduated") score = 5;
  if (student.status === "withdrawn") score = Math.min(score, 2);

  score = Math.max(1, Math.min(5, score));
  const labels = ["At risk", "Needs support", "Fair", "On track", "Strong", "Exemplary"];
  return { score, label: labels[score] ?? "On track" };
}
