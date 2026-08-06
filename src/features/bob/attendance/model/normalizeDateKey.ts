/** Normalize attendance date strings for Map keys (YYYY-MM-DD). */
export function normalizeAttendanceDateKey(value: string | null | undefined): string {
  return String(value || "").trim().slice(0, 10);
}
