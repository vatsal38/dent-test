import type { BobStudent } from "@/platform/api/bob/students";
import {
  expectedHoursForDate,
  isProgramDay,
  listProgramDates,
  PROGRAM_END_DATE,
  PROGRAM_START_DATE,
} from "@/lib/bobProgramCalendar";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";
import { resolveStudentTrackLabel, isStudentPresentToday } from "@/lib/bobRosterTrackOptions";
import type { StudentDayAttendance } from "../types";
import { getWeekMonday, getWeekSunday } from "../weekDates";
import { parseHoursLabel, resolveDayHoursNumeric } from "./dayHours";

export interface HoursRollupPeriod {
  hoursAttended: number;
  hoursPotential: number;
  hoursPct: number;
  /** Present/absent rollup for today (student-day, not hours). */
  presentCount?: number;
  expectedCount?: number;
  presentPct?: number;
}

export interface MonthHoursRollup {
  /** YYYY-MM */
  key: string;
  /** e.g. June 2026 */
  label: string;
  /** Short label e.g. Jun */
  shortLabel: string;
  startDate: string;
  endDate: string;
  programDayCount: number;
  period: HoursRollupPeriod;
}

export interface TrackHoursRollupRow {
  trackKey: string;
  trackLabel: string;
  studentCount: number;
  today: HoursRollupPeriod;
  week: HoursRollupPeriod;
  program: HoursRollupPeriod;
  /** Hours rollup for each calendar month in the program (through focus date). */
  months: MonthHoursRollup[];
}

export interface HoursAttendanceRollup {
  overall: TrackHoursRollupRow;
  byTrack: TrackHoursRollupRow[];
  /** Program months available for the month view (shared keys/labels). */
  monthColumns: Array<{
    key: string;
    label: string;
    shortLabel: string;
    startDate: string;
    endDate: string;
    programDayCount: number;
  }>;
}

interface HoursBucket {
  attended: number;
  potential: number;
}

interface PresentBucket {
  present: number;
  expected: number;
}

function emptyPresentBucket(): PresentBucket {
  return { present: 0, expected: 0 };
}

function pctFromPresentBucket(bucket: PresentBucket): Pick<
  HoursRollupPeriod,
  "presentCount" | "expectedCount" | "presentPct"
> {
  const presentCount = bucket.present;
  const expectedCount = bucket.expected;
  const presentPct =
    expectedCount > 0 ? Math.round((presentCount / expectedCount) * 100) : 0;
  return { presentCount, expectedCount, presentPct };
}

function emptyBucket(): HoursBucket {
  return { attended: 0, potential: 0 };
}

function pctFromBucket(bucket: HoursBucket): HoursRollupPeriod {
  const hoursAttended = Math.round(bucket.attended * 100) / 100;
  const hoursPotential = Math.round(bucket.potential * 100) / 100;
  const hoursPct =
    hoursPotential > 0 ? Math.round((hoursAttended / hoursPotential) * 100) : 0;
  return { hoursAttended, hoursPotential, hoursPct };
}

function hoursFromDay(day: StudentDayAttendance): HoursBucket {
  const potential =
    parseHoursLabel(day.expectedHoursLabel) || expectedHoursForDate(day.date);
  const attended = resolveDayHoursNumeric(day);
  return { attended, potential };
}

function rosterPotentialForDates(dates: string[]): number {
  return dates.reduce((sum, date) => sum + expectedHoursForDate(date), 0);
}

function indexDaysByStudentDate(days: StudentDayAttendance[]) {
  const map = new Map<string, StudentDayAttendance[]>();
  for (const day of days) {
    if (!isProgramDay(day.date)) continue;
    const key = `${day.studentId}|${day.date}`;
    const list = map.get(key) || [];
    list.push(day);
    map.set(key, list);
  }
  return map;
}

function mergeBucket(target: HoursBucket, source: HoursBucket) {
  target.attended += source.attended;
  target.potential += source.potential;
}

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Calendar months that overlap the program window through `throughDate`. */
export function listProgramMonths(throughDate: string): Array<{
  key: string;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  dates: string[];
}> {
  const through = String(throughDate || "").slice(0, 10);
  const programDates = listProgramDates({
    startDate: PROGRAM_START_DATE,
    endDate: PROGRAM_END_DATE,
    throughDate: through,
  });
  if (!programDates.length) return [];

  const byMonth = new Map<string, string[]>();
  for (const date of programDates) {
    const key = date.slice(0, 7);
    const list = byMonth.get(key) || [];
    list.push(date);
    byMonth.set(key, list);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dates]) => {
      const monthIdx = Number(key.slice(5, 7)) - 1;
      const year = key.slice(0, 4);
      return {
        key,
        label: `${MONTH_LONG[monthIdx] || key} ${year}`,
        shortLabel: MONTH_SHORT[monthIdx] || key,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        dates,
      };
    });
}

function finalizeMonths(
  monthDefs: ReturnType<typeof listProgramMonths>,
  monthBuckets: Map<string, HoursBucket>,
): MonthHoursRollup[] {
  return monthDefs.map((m) => ({
    key: m.key,
    label: m.label,
    shortLabel: m.shortLabel,
    startDate: m.startDate,
    endDate: m.endDate,
    programDayCount: m.dates.length,
    period: pctFromBucket(monthBuckets.get(m.key) || emptyBucket()),
  }));
}

function finalizeRow(
  trackKey: string,
  trackLabel: string,
  studentCount: number,
  today: HoursBucket,
  week: HoursBucket,
  program: HoursBucket,
  todayPresent: PresentBucket,
  months: MonthHoursRollup[],
): TrackHoursRollupRow {
  return {
    trackKey,
    trackLabel,
    studentCount,
    today: { ...pctFromBucket(today), ...pctFromPresentBucket(todayPresent) },
    week: pctFromBucket(week),
    program: pctFromBucket(program),
    months,
  };
}

export function buildHoursAttendanceRollup(input: {
  students: BobStudent[];
  focusDate: string;
  todayDays: StudentDayAttendance[];
  weekDays: StudentDayAttendance[];
  programDays: StudentDayAttendance[];
}): HoursAttendanceRollup {
  const { students, focusDate, todayDays, weekDays, programDays } = input;
  const weekStart = getWeekMonday(new Date(`${focusDate}T12:00:00`));
  const weekEnd = getWeekSunday(weekStart);
  const weekProgramDates = listProgramDates({
    startDate: weekStart,
    endDate: weekEnd,
    throughDate: focusDate,
  });
  const programDates = listProgramDates({
    startDate: PROGRAM_START_DATE,
    throughDate: focusDate,
  });
  const monthDefs = listProgramMonths(focusDate);
  const weekPotentialPerStudent = rosterPotentialForDates(weekProgramDates);
  const programPotentialPerStudent = rosterPotentialForDates(programDates);
  const monthPotentialPerStudent = new Map(
    monthDefs.map((m) => [m.key, rosterPotentialForDates(m.dates)]),
  );

  const todayByStudent = new Map<string, StudentDayAttendance[]>();
  for (const day of todayDays) {
    const list = todayByStudent.get(day.studentId) || [];
    list.push(day);
    todayByStudent.set(day.studentId, list);
  }

  const weekByStudentDate = indexDaysByStudentDate(
    weekDays.filter((day) => day.date >= weekStart && day.date <= weekEnd),
  );
  const programByStudentDate = indexDaysByStudentDate(
    programDays.filter(
      (day) => day.date >= PROGRAM_START_DATE && day.date <= focusDate,
    ),
  );

  type TrackBucket = {
    label: string;
    students: number;
    today: HoursBucket;
    week: HoursBucket;
    program: HoursBucket;
    todayPresent: PresentBucket;
    months: Map<string, HoursBucket>;
  };

  const trackBuckets = new Map<string, TrackBucket>();
  const overall: TrackBucket = {
    label: "BoB overall",
    students: 0,
    today: emptyBucket(),
    week: emptyBucket(),
    program: emptyBucket(),
    todayPresent: emptyPresentBucket(),
    months: new Map(monthDefs.map((m) => [m.key, emptyBucket()])),
  };

  function ensureMonthBuckets(bucket: TrackBucket) {
    for (const m of monthDefs) {
      if (!bucket.months.has(m.key)) bucket.months.set(m.key, emptyBucket());
    }
  }

  for (const student of students) {
    const trackLabel = formatBobTrackDisplayLabel(
      resolveStudentTrackLabel(student),
    );
    if (/^applicant$/i.test(trackLabel) || /^global$/i.test(trackLabel)) {
      continue;
    }
    const trackKey = trackLabel || "Unassigned";
    let row = trackBuckets.get(trackKey);
    if (!row) {
      row = {
        label: trackKey,
        students: 0,
        today: emptyBucket(),
        week: emptyBucket(),
        program: emptyBucket(),
        todayPresent: emptyPresentBucket(),
        months: new Map(monthDefs.map((m) => [m.key, emptyBucket()])),
      };
      trackBuckets.set(trackKey, row);
    }
    ensureMonthBuckets(row);
    row.students += 1;
    overall.students += 1;

    const todayStudentDays = todayByStudent.get(student.id) || [];
    if (isProgramDay(focusDate)) {
      row.todayPresent.expected += 1;
      overall.todayPresent.expected += 1;
      if (todayStudentDays.some((day) => isStudentPresentToday(day))) {
        row.todayPresent.present += 1;
        overall.todayPresent.present += 1;
      }
    }

    for (const day of todayStudentDays) {
      const h = hoursFromDay(day);
      mergeBucket(row.today, h);
      mergeBucket(overall.today, h);
    }

    for (const date of weekProgramDates) {
      const daysForDate = weekByStudentDate.get(`${student.id}|${date}`) || [];
      for (const day of daysForDate) {
        const h = hoursFromDay(day);
        row.week.attended += h.attended;
        overall.week.attended += h.attended;
      }
    }
    row.week.potential += weekPotentialPerStudent;
    overall.week.potential += weekPotentialPerStudent;

    for (const date of programDates) {
      const daysForDate = programByStudentDate.get(`${student.id}|${date}`) || [];
      for (const day of daysForDate) {
        const h = hoursFromDay(day);
        row.program.attended += h.attended;
        overall.program.attended += h.attended;

        const monthKey = date.slice(0, 7);
        const rowMonth = row.months.get(monthKey);
        const overallMonth = overall.months.get(monthKey);
        if (rowMonth) rowMonth.attended += h.attended;
        if (overallMonth) overallMonth.attended += h.attended;
      }
    }
    row.program.potential += programPotentialPerStudent;
    overall.program.potential += programPotentialPerStudent;

    for (const m of monthDefs) {
      const pot = monthPotentialPerStudent.get(m.key) || 0;
      const rowMonth = row.months.get(m.key);
      const overallMonth = overall.months.get(m.key);
      if (rowMonth) rowMonth.potential += pot;
      if (overallMonth) overallMonth.potential += pot;
    }
  }

  const byTrack = Array.from(trackBuckets.entries())
    .map(([trackKey, bucket]) =>
      finalizeRow(
        trackKey,
        bucket.label,
        bucket.students,
        bucket.today,
        bucket.week,
        bucket.program,
        bucket.todayPresent,
        finalizeMonths(monthDefs, bucket.months),
      ),
    )
    .sort((a, b) => a.trackLabel.localeCompare(b.trackLabel));

  return {
    overall: finalizeRow(
      "__all__",
      "Bet on Baltimore overall",
      overall.students,
      overall.today,
      overall.week,
      overall.program,
      overall.todayPresent,
      finalizeMonths(monthDefs, overall.months),
    ),
    byTrack,
    monthColumns: monthDefs.map((m) => ({
      key: m.key,
      label: m.label,
      shortLabel: m.shortLabel,
      startDate: m.startDate,
      endDate: m.endDate,
      programDayCount: m.dates.length,
    })),
  };
}
