import type { PunchType } from "@/features/bob/attendance/types";

export const PROGRAM_START_DATE = "2026-06-29";
export const PROGRAM_END_DATE = "2026-07-31";
export const SHOWCASE_DATE = "2026-07-29";

const PROGRAM_HOLIDAYS = new Set(["2026-07-03"]);

const ALL_PUNCH_TYPES: PunchType[] = ["am_in", "am_out", "pm_in", "pm_out"];
const SHOWCASE_PUNCH_TYPES: PunchType[] = ["pm_in", "pm_out"];

const MS_PER_DAY = 86400000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseDateIso(iso: string) {
  const d = new Date(`${String(iso || "").slice(0, 10)}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWeekday(iso: string) {
  const day = parseDateIso(iso)?.getUTCDay() ?? -1;
  return day >= 1 && day <= 5;
}

export function isProgramHoliday(iso: string) {
  return PROGRAM_HOLIDAYS.has(String(iso || "").slice(0, 10));
}

export function isShowcaseDay(iso: string) {
  return String(iso || "").slice(0, 10) === SHOWCASE_DATE;
}

export function isWithinProgramRange(iso: string) {
  const d = String(iso || "").slice(0, 10);
  return d >= PROGRAM_START_DATE && d <= PROGRAM_END_DATE;
}

export function isProgramDay(iso: string) {
  return isWithinProgramRange(iso) && isWeekday(iso) && !isProgramHoliday(iso);
}

export function expectedPunchTypes(iso: string): PunchType[] {
  if (!isProgramDay(iso)) return [];
  if (isShowcaseDay(iso)) return [...SHOWCASE_PUNCH_TYPES];
  return [...ALL_PUNCH_TYPES];
}

export function listProgramDates(options?: {
  startDate?: string;
  endDate?: string;
  throughDate?: string;
  throughToday?: boolean;
}) {
  const start = parseDateIso(options?.startDate || PROGRAM_START_DATE);
  const end = parseDateIso(options?.endDate || PROGRAM_END_DATE);
  const cap = parseDateIso(
    options?.throughDate ||
      (options?.throughToday === false ? options?.endDate || PROGRAM_END_DATE : todayISO()),
  );
  if (!start || !end || !cap) return [];

  const lastMs = Math.min(end.getTime(), cap.getTime());
  if (lastMs < start.getTime()) return [];

  const dates: string[] = [];
  for (let t = start.getTime(); t <= lastMs; t += MS_PER_DAY) {
    const iso = new Date(t).toISOString().slice(0, 10);
    if (isProgramDay(iso)) dates.push(iso);
  }
  return dates;
}

export function isAttendanceExpectedOn(iso: string, now = new Date()) {
  if (!isProgramDay(iso)) return false;
  return String(iso).slice(0, 10) <= now.toISOString().slice(0, 10);
}

export function expectedHoursForDate(iso: string): number {
  if (!isProgramDay(iso)) return 0;
  if (isShowcaseDay(iso)) return 6;
  return 5;
}

export function getDaySchedule(iso: string) {
  if (!isProgramDay(iso)) {
    return { kind: "off" as const, sessions: [] as Array<{ label: string; start: string; end: string; punches: PunchType[] }> };
  }
  if (isShowcaseDay(iso)) {
    return {
      kind: "showcase" as const,
      sessions: [
        { label: "Showcase", start: "14:30", end: "20:30", punches: SHOWCASE_PUNCH_TYPES },
      ],
    };
  }
  return {
    kind: "normal" as const,
    sessions: [
      { label: "Morning", start: "10:00", end: "12:30", punches: ["am_in", "am_out"] as PunchType[] },
      { label: "Afternoon", start: "13:30", end: "16:00", punches: ["pm_in", "pm_out"] as PunchType[] },
    ],
  };
}

export function isBeforeProgramStart(iso: string) {
  return String(iso || "").slice(0, 10) < PROGRAM_START_DATE;
}

export function isAfterProgramEnd(iso: string) {
  return String(iso || "").slice(0, 10) > PROGRAM_END_DATE;
}

/** Default attendance focus date — uses program window, not wall-clock today when pre-season. */
export function resolveDefaultAttendanceFocusDate(options?: {
  requestedDate?: string | null;
  latestImportedDate?: string | null;
}): string {
  const today = todayISO();
  const requested = options?.requestedDate
    ? String(options.requestedDate).slice(0, 10)
    : null;
  if (requested) {
    if (isAfterProgramEnd(requested)) return PROGRAM_END_DATE;
    return requested;
  }

  const latest = options?.latestImportedDate
    ? String(options.latestImportedDate).slice(0, 10)
    : null;
  const inProgramLatest =
    latest && isWithinProgramRange(latest) ? latest : null;

  if (isBeforeProgramStart(today)) {
    return inProgramLatest || PROGRAM_START_DATE;
  }
  if (isAfterProgramEnd(today)) {
    return inProgramLatest || PROGRAM_END_DATE;
  }
  if (isProgramDay(today)) return today;

  const programDates = listProgramDates({ throughDate: today });
  const lastProgramDay = programDates[programDates.length - 1];
  return inProgramLatest || lastProgramDay || PROGRAM_START_DATE;
}

export function clampDateToProgramWindow(iso: string): string {
  const d = String(iso || "").slice(0, 10);
  if (d < PROGRAM_START_DATE) return PROGRAM_START_DATE;
  if (d > PROGRAM_END_DATE) return PROGRAM_END_DATE;
  return d;
}

/** Earliest selectable date in attendance hub — includes pre-season imported rows. */
export function resolveAttendancePickerMinDate(
  earliestImportedDate?: string | null,
): string {
  const earliest = String(earliestImportedDate || "").slice(0, 10);
  if (earliest && earliest < PROGRAM_START_DATE) return earliest;
  return PROGRAM_START_DATE;
}
