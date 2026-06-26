/** Date + time helpers for staff attendance record editing. */

export function toTimeInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function combineDateAndTime(
  date: string,
  time: string,
): string | null {
  const t = String(time || "").trim();
  if (!t || !date) return null;
  const d = new Date(`${date}T${t}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function clearableIso(
  date: string,
  time: string,
  previous?: string | null,
): string | null | undefined {
  return staffCorrectionIso(date, time, previous);
}

/** Persist only when staff entered a value, or explicitly cleared a prior correction. */
export function staffCorrectionIso(
  date: string,
  time: string,
  previousStaffValue?: string | null,
): string | null | undefined {
  const t = String(time || "").trim();
  if (!t) {
    if (previousStaffValue) return null;
    return undefined;
  }
  return combineDateAndTime(date, t);
}
