import type { BobAttendance } from "@/platform/api/bob/attendance";
import type { StudentDayAttendance } from "../types";

export function hasStaffAnnotation(record: {
  notes?: string | null;
  manualOverride?: string | null;
}): boolean {
  return Boolean(
    String(record.notes || "").trim() || String(record.manualOverride || "").trim(),
  );
}

/** Merge staff notes / manual override from every attendance row for one student-day. */
export function mergeStaffAnnotations(
  records: BobAttendance[],
): { notes?: string; manualOverride?: string } {
  const noteParts: string[] = [];
  let manualOverride: string | undefined;

  for (const record of records) {
    const note = String(record.notes || "").trim();
    if (note && !noteParts.includes(note)) noteParts.push(note);

    const override = String(record.manualOverride || "").trim();
    if (override && !manualOverride) manualOverride = override;
  }

  return {
    notes: noteParts.length ? noteParts.join(" · ") : undefined,
    manualOverride,
  };
}

export function resolveAttendanceStaffNote(
  day: Pick<StudentDayAttendance, "notes" | "manualOverride">,
): string | null {
  const note = String(day.notes || "").trim();
  const override = String(day.manualOverride || "").trim();
  if (note && override && note !== override) {
    return `${note} · ${override}`;
  }
  return note || override || null;
}
