import { listProgramDates } from "@/lib/bobProgramCalendar";

/** Program weekdays between two dates (inclusive). */
export function countPtoProgramDays(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): number | null {
  const start = startIso ? String(startIso).slice(0, 10) : "";
  const end = endIso ? String(endIso).slice(0, 10) : "";
  if (!start || !end || end < start) return null;
  return listProgramDates({ startDate: start, endDate: end }).length;
}
