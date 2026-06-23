import type { BobStudent } from "@/platform/api/bob/students";
import type { BobAttendance } from "@/platform/api/bob/attendance";
import { expectedHoursForDate, isProgramDay } from "@/lib/bobProgramCalendar";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";
import { resolveStudentTrackLabel } from "@/lib/bobRosterTrackOptions";
import type { StudentDayAttendance } from "../types";
import { getWeekMonday, getWeekSunday } from "../weekDates";
import { parseHoursLabel, resolveDayHoursNumeric } from "./dayHours";

export interface HoursRollupPeriod {
  hoursAttended: number;
  hoursPotential: number;
  hoursPct: number;
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
): TrackHoursRollupRow {
  return {
    trackKey,
    trackLabel,
    studentCount,
    today: pctFromBucket(today),
    week: pctFromBucket(week),
    program: pctFromBucket(program),
  };
}

export function buildHoursAttendanceRollup(input: {
  students: BobStudent[];
  focusDate: string;
  todayDays: StudentDayAttendance[];
  weekRecords: BobAttendance[];
}): HoursAttendanceRollup {
  const { students, focusDate, todayDays, weekRecords } = input;
  const weekStart = getWeekMonday(new Date(`${focusDate}T12:00:00`));
  const weekEnd = getWeekSunday(weekStart);

  const todayByStudent = new Map<string, StudentDayAttendance[]>();
  for (const day of todayDays) {
    const list = todayByStudent.get(day.studentId) || [];
    list.push(day);
    todayByStudent.set(day.studentId, list);
  }

  const weekByStudentDate = new Map<string, BobAttendance[]>();
  for (const row of weekRecords) {
    const date = String(row.date || "").slice(0, 10);
    if (!date || date < weekStart || date > weekEnd || !isProgramDay(date)) {
      continue;
    }
    const sid = String(row.studentId || "");
    if (!sid) continue;
    const key = `${sid}|${date}`;
    const list = weekByStudentDate.get(key) || [];
    list.push(row);
    weekByStudentDate.set(key, list);
  }

  const trackBuckets = new Map<
    string,
    {
      label: string;
      students: number;
      today: HoursBucket;
      week: HoursBucket;
      program: HoursBucket;
    }
  >();
  const overall = {
    label: "BoB overall",
    students: 0,
    today: emptyBucket(),
    week: emptyBucket(),
    program: emptyBucket(),
  };

  for (const student of students) {
    const trackLabel = formatBobTrackDisplayLabel(
      resolveStudentTrackLabel(student),
    );
    const trackKey = trackLabel || "Unassigned";
    let row = trackBuckets.get(trackKey);
    if (!row) {
      row = {
        label: trackKey,
        students: 0,
        today: emptyBucket(),
        week: emptyBucket(),
        program: emptyBucket(),
      };
      trackBuckets.set(trackKey, row);
    }
    row.students += 1;
    overall.students += 1;

    const stats = student.attendanceStats;
    const programHours: HoursBucket = {
      attended: Number(stats?.hoursAttended) || 0,
      potential: Number(stats?.hoursPotential) || 0,
    };
    mergeBucket(row.program, programHours);
    mergeBucket(overall.program, programHours);

    for (const day of todayByStudent.get(student.id) || []) {
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
      ),
    )
    .sort((a, b) => a.trackLabel.localeCompare(b.trackLabel));

  return {
    overall: finalizeRow(
      "__all__",
      "BoB overall",
      overall.students,
      overall.today,
      overall.week,
      overall.program,
    ),
    byTrack,
  };
}
