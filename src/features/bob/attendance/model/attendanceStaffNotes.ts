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

const STAFF_CORRECTION_AUDIT_RE =
  /\[Staff correction\s+([^\]]+?)\s+by\s+([^\]]+?)\]/gi;

/** Latest staff edit stamp appended when saving in Dent (see applyStaffFields). */
export function parseLatestStaffCorrectionAudit(
  notes?: string | null,
): { at?: string; by?: string } | null {
  const text = String(notes || "");
  if (!text) return null;
  let last: { at?: string; by?: string } | null = null;
  for (const match of text.matchAll(STAFF_CORRECTION_AUDIT_RE)) {
    last = {
      at: String(match[1] || "").trim() || undefined,
      by: String(match[2] || "").trim() || undefined,
    };
  }
  return last;
}

export function resolveStaffCorrectionAttribution(daily?: {
  staffCorrectedByName?: string | null;
  staffCorrectedAt?: string | null;
  notes?: string | null;
} | null): { by?: string; at?: string } | null {
  const byName = String(daily?.staffCorrectedByName || "").trim();
  if (byName) {
    const at = daily?.staffCorrectedAt
      ? new Date(daily.staffCorrectedAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : undefined;
    return { by: byName, at };
  }
  const audit = parseLatestStaffCorrectionAudit(daily?.notes);
  if (audit?.by) return audit;
  return null;
}
