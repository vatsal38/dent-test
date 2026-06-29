import type { BobStudent } from "@/platform/api/bob/students";
import type { BobAttendance } from "@/platform/api/bob/attendance";
import { expectedHoursForDate, isProgramDay, PROGRAM_START_DATE } from "@/lib/bobProgramCalendar";
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

export interface TrackHoursRollupRow {
  trackKey: string;
  trackLabel: string;
  studentCount: number;
  today: HoursRollupPeriod;
  week: HoursRollupPeriod;
  program: HoursRollupPeriod;
}

export interface HoursAttendanceRollup {
  overall: TrackHoursRollupRow;
  byTrack: TrackHoursRollupRow[];
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

function hoursFromAttendanceRecord(
  row: BobAttendance,
  date: string,
): HoursBucket {
  const potential =
    parseHoursLabel(row.maxHours) || expectedHoursForDate(date);
  let attended =
    parseHoursLabel(row.hoursPresent) || parseHoursLabel(row.totalHours);
  if (
    attended <= 0 &&
    (row.status === "present" || row.status === "late")
  ) {
    attended = potential;
  }
  return { attended, potential };
}

function mergeBucket(target: HoursBucket, source: HoursBucket) {
  target.attended += source.attended;
  target.potential += source.potential;
}

function finalizeRow(
  trackKey: string,
  trackLabel: string,
  studentCount: number,
  today: HoursBucket,
  week: HoursBucket,
  program: HoursBucket,
  todayPresent: PresentBucket,
): TrackHoursRollupRow {
  return {
    trackKey,
    trackLabel,
    studentCount,
    today: { ...pctFromBucket(today), ...pctFromPresentBucket(todayPresent) },
    week: pctFromBucket(week),
    program: pctFromBucket(program),
  };
}

export function buildHoursAttendanceRollup(input: {
  students: BobStudent[];
  focusDate: string;
  todayDays: StudentDayAttendance[];
  weekRecords: BobAttendance[];
  programRecords?: BobAttendance[];
}): HoursAttendanceRollup {
  const { students, focusDate, todayDays, weekRecords, programRecords = [] } =
    input;
  const weekStart = getWeekMonday(new Date(`${focusDate}T12:00:00`));
  const weekEnd = getWeekSunday(weekStart);

  const todayByStudent = new Map<string, StudentDayAttendance[]>();
  for (const day of todayDays) {
    const list = todayByStudent.get(day.studentId) || [];
    list.push(day);
    todayByStudent.set(day.studentId, list);
  }

  function indexRecordsByStudentDate(records: BobAttendance[]) {
    const map = new Map<string, BobAttendance[]>();
    for (const row of records) {
      const date = String(row.date || "").slice(0, 10);
      if (!date || !isProgramDay(date)) continue;
      const sid = String(row.studentId || "");
      if (!sid) continue;
      const key = `${sid}|${date}`;
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    }
    return map;
  }

  const weekByStudentDate = indexRecordsByStudentDate(
    weekRecords.filter((row) => {
      const date = String(row.date || "").slice(0, 10);
      return date >= weekStart && date <= weekEnd;
    }),
  );
  const programByStudentDate = indexRecordsByStudentDate(
    programRecords.filter((row) => {
      const date = String(row.date || "").slice(0, 10);
      return date >= PROGRAM_START_DATE && date <= focusDate;
    }),
  );

  const trackBuckets = new Map<
    string,
    {
      label: string;
      students: number;
      today: HoursBucket;
      week: HoursBucket;
      program: HoursBucket;
      todayPresent: PresentBucket;
    }
  >();
  const overall = {
    label: "BoB overall",
    students: 0,
    today: emptyBucket(),
    week: emptyBucket(),
    program: emptyBucket(),
    todayPresent: emptyPresentBucket(),
  };

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
      };
      trackBuckets.set(trackKey, row);
    }
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

    for (let t = new Date(`${weekStart}T12:00:00`).getTime();
      t <= new Date(`${weekEnd}T12:00:00`).getTime();
      t += 86400000
    ) {
      const date = new Date(t).toISOString().slice(0, 10);
      if (!isProgramDay(date)) continue;
      const rows = weekByStudentDate.get(`${student.id}|${date}`) || [];
      const daily = rows.find((r) => !r.signType) || rows[0];
      if (!daily) continue;
      const h = hoursFromAttendanceRecord(daily, date);
      mergeBucket(row.week, h);
      mergeBucket(overall.week, h);
    }

    const programDates = new Set<string>();
    for (const key of programByStudentDate.keys()) {
      const [sid, date] = key.split("|");
      if (sid === student.id) programDates.add(date);
    }
    for (const date of programDates) {
      const rows = programByStudentDate.get(`${student.id}|${date}`) || [];
      const daily = rows.find((r) => !r.signType) || rows[0];
      if (!daily) continue;
      const h = hoursFromAttendanceRecord(daily, date);
      mergeBucket(row.program, h);
      mergeBucket(overall.program, h);
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
    ),
    byTrack,
  };
}
