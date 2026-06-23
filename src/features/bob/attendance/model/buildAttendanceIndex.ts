import type { BobAttendance, BobAttendanceStatus } from "@/platform/api/bob/attendance";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import {
  PUNCH_TYPES,
  type AttendanceSession,
  type AttendanceState,
  type DayHealth,
  type PunchSlot,
  type PunchType,
  type PunchVisualState,
  type StudentDayAttendance,
} from "../types";
import { formatAttendanceTime, formatHoursLabel } from "./formatAttendanceTime";
import {
  computeHoursPresentFromStaffTimes,
} from "./staffRecordDerived";
import { toTimeInputValue } from "./attendanceRecordTime";
import {
  expectedPunchTypes,
  isAttendanceExpectedOn,
  isProgramDay,
  isShowcaseDay,
} from "@/lib/bobProgramCalendar";
import {
  isDailyAttendanceRecord,
  isPunchEventRecord,
  normalizeSignType,
} from "./normalizeSignType";
import {
  mapAttendanceStateFromRecord,
  sessionStatusLabel,
} from "./mapAttendanceState";

function emptyPunches(): Record<PunchType, PunchSlot> {
  return Object.fromEntries(
    PUNCH_TYPES.map((t) => [t, { type: t, state: "missing" as PunchVisualState }]),
  ) as Record<PunchType, PunchSlot>;
}

function punchStateFromAttendanceState(state: AttendanceState): PunchVisualState {
  if (state === "present") return "recorded";
  if (state === "late") return "late";
  if (state === "excused") return "excused";
  if (state === "absent") return "absent";
  if (state === "auto_filled") return "auto_filled";
  return "missing";
}

function applyStatusToPunches(
  punches: Record<PunchType, PunchSlot>,
  status: BobAttendanceStatus,
): Record<PunchType, PunchSlot> {
  const next = { ...punches };
  const mapState = (pt: PunchType): PunchVisualState => {
    if (status === "present") return "recorded";
    if (status === "late") return pt === "am_in" ? "late" : "recorded";
    if (status === "excused") return "excused";
    if (status === "absent") return "absent";
    return "missing";
  };
  for (const pt of PUNCH_TYPES) {
    if (next[pt].state === "missing") {
      next[pt] = { ...next[pt], state: mapState(pt) };
    }
  }
  return next;
}

function setPunchTime(
  punches: Record<PunchType, PunchSlot>,
  pt: PunchType,
  opts: {
    display?: string;
    original?: string;
    adjusted?: string;
    eventId?: string;
    state?: PunchVisualState;
    reason?: string;
    source?: string;
  },
) {
  punches[pt] = {
    type: pt,
    state: opts.state ?? "recorded",
    eventId: opts.eventId,
    timeLabel: opts.display,
    originalTimeLabel: opts.original,
    adjustedTimeLabel: opts.adjusted,
    adjustmentReason: opts.reason,
    adjustmentSource: opts.source,
  };
}

function populateDailyRecordPunches(
  punches: Record<PunchType, PunchSlot>,
  daily: BobAttendance,
  attendanceState: AttendanceState,
) {
  const amInDisplay = formatAttendanceTime(daily.adjustedSignIn || daily.signInTime);
  const amInOriginal = formatAttendanceTime(daily.rawSignInTime);
  const amInAdjusted = formatAttendanceTime(daily.adjustedSignIn);
  const pmOutDisplay = formatAttendanceTime(daily.adjustedSignOut || daily.signOutTime);
  const pmOutOriginal = formatAttendanceTime(daily.rawSignOutTime);
  const pmOutAdjusted = formatAttendanceTime(daily.adjustedSignOut);

  const manualStart = formatAttendanceTime(daily.manualStartTime);
  const manualEnd = formatAttendanceTime(daily.manualEndTime);
  const staffIn = formatAttendanceTime(daily.staffCorrectionSignIn);
  const staffOut = formatAttendanceTime(daily.staffCorrectionSignOut);

  const punchState = punchStateFromAttendanceState(attendanceState);
  const correctionSource = daily.manualOverride ? "Manual override" : "Coach correction";

  if (amInDisplay || amInOriginal) {
    setPunchTime(punches, "am_in", {
      display: amInDisplay || amInOriginal,
      original: amInOriginal,
      adjusted: amInAdjusted,
      eventId: daily.id,
      state: punchState === "missing" ? "recorded" : punchState,
      reason: amInAdjusted && amInOriginal !== amInAdjusted ? correctionSource : undefined,
      source: amInAdjusted ? correctionSource : undefined,
    });
  }

  if (staffOut || manualEnd) {
    setPunchTime(punches, "am_out", {
      display: staffOut || manualEnd,
      original: manualEnd,
      adjusted: staffOut,
      state: punchState,
      reason: staffOut ? correctionSource : undefined,
      source: staffOut ? correctionSource : undefined,
    });
  }

  if (manualStart || staffIn) {
    setPunchTime(punches, "pm_in", {
      display: staffIn || manualStart,
      original: manualStart,
      adjusted: staffIn,
      state: punchState,
      reason: staffIn ? correctionSource : undefined,
      source: staffIn ? correctionSource : undefined,
    });
  }

  if (pmOutDisplay || pmOutOriginal) {
    setPunchTime(punches, "pm_out", {
      display: pmOutDisplay || pmOutOriginal,
      original: pmOutOriginal,
      adjusted: pmOutAdjusted,
      eventId: daily.id,
      state: punchState === "missing" ? "recorded" : punchState,
      reason: pmOutAdjusted && pmOutOriginal !== pmOutAdjusted ? correctionSource : undefined,
      source: pmOutAdjusted ? correctionSource : undefined,
    });
  }
}

function buildSession(
  punches: Record<PunchType, PunchSlot>,
  inType: PunchType,
  outType: PunchType,
  hoursLabel?: string,
  attendanceState?: AttendanceState,
): AttendanceSession {
  const missingLabels: string[] = [];
  if (punches[inType].state === "missing") missingLabels.push("In");
  if (punches[outType].state === "missing") missingLabels.push("Out");
  return {
    in: punches[inType],
    out: punches[outType],
    hoursLabel,
    statusLabel: sessionStatusLabel(
      attendanceState ?? "missing_punch",
      missingLabels.map((l) => `${inType.includes("am") ? "AM" : "PM"} ${l}`),
    ),
  };
}

function deriveHealth(
  punches: Record<PunchType, PunchSlot>,
  attendanceState: AttendanceState,
  dailyStatus?: BobAttendanceStatus,
  date?: string,
): { health: DayHealth; missingPunchCount: number; isLate: boolean } {
  if (date && isProgramDay(date) && !isAttendanceExpectedOn(date)) {
    return { health: "future", missingPunchCount: 0, isLate: false };
  }

  const required = date ? expectedPunchTypes(date) : [...PUNCH_TYPES];
  const states = required.map((t) => punches[t].state);
  const missingPunchCount = states.filter((s) => s === "missing").length;
  const isLate = attendanceState === "late" || dailyStatus === "late";

  if (required.length === 0) {
    return { health: "complete", missingPunchCount: 0, isLate: false };
  }

  if (attendanceState === "absent" || dailyStatus === "absent")
    return { health: "absent", missingPunchCount, isLate };
  if (attendanceState === "excused" || dailyStatus === "excused")
    return { health: "excused", missingPunchCount, isLate };
  if (attendanceState === "auto_filled")
    return { health: "auto_filled", missingPunchCount, isLate };
  if (isLate && missingPunchCount === 0)
    return { health: "late", missingPunchCount, isLate };
  if (attendanceState === "present" && missingPunchCount === 0)
    return { health: "complete", missingPunchCount, isLate };
  if (attendanceState === "missing_punch" || missingPunchCount > 0)
    return {
      health: missingPunchCount === required.length ? "missing" : "partial",
      missingPunchCount,
      isLate,
    };
  if (missingPunchCount === 0)
    return { health: "complete", missingPunchCount, isLate };
  return { health: "partial", missingPunchCount, isLate };
}

export interface ExpectedEnrollment {
  studentId: string;
  podId: string;
}

export const UNASSIGNED_POD_ID = "__unassigned__";

export function isBaselineDailyRecord(record: {
  source?: string | null;
}): boolean {
  return String(record.source || "").trim() === "roster_baseline";
}

export function isAirtableSourcedAttendance(record: BobAttendance): boolean {
  return Boolean(record.airtableRecordId && String(record.airtableRecordId).trim());
}

function dailyRecordPriority(record: BobAttendance): number {
  if (isBaselineDailyRecord(record)) return 0;
  if (isAirtableSourcedAttendance(record)) return 4;
  if (isDailyAttendanceRecord(record)) return 3;
  if (record.status) return 2;
  return 1;
}

function shouldPreferDailyRecord(
  existing: BobAttendance | undefined,
  incoming: BobAttendance,
): boolean {
  if (!existing) return true;
  const existingScore = dailyRecordPriority(existing);
  const incomingScore = dailyRecordPriority(incoming);
  if (incomingScore !== existingScore) return incomingScore > existingScore;
  return Boolean(incoming.updatedAt && existing.updatedAt
    ? incoming.updatedAt > existing.updatedAt
    : false);
}

export function listExpectedEnrollments(
  pods: BobPod[],
  podFilter?: string,
  validStudentIds?: Set<string>,
): ExpectedEnrollment[] {
  const podsToUse = podFilter ? pods.filter((p) => p.id === podFilter) : pods;
  const seen = new Set<string>();
  const out: ExpectedEnrollment[] = [];
  for (const pod of podsToUse) {
    for (const studentId of pod.students || []) {
      const sid = String(studentId);
      if (validStudentIds && !validStudentIds.has(sid)) continue;
      const key = `${pod.id}|${sid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ studentId: sid, podId: pod.id });
    }
  }
  return out;
}

export function supplementEnrollmentsFromStudents(
  students: BobStudent[],
  enrollments: ExpectedEnrollment[],
  podFilter?: string,
): ExpectedEnrollment[] {
  const seen = new Set(enrollments.map((e) => `${e.podId}|${e.studentId}`));
  const out = [...enrollments];

  for (const student of students) {
    const studentId = String(student.id);
    const podId = student.podId ? String(student.podId) : UNASSIGNED_POD_ID;
    if (podFilter && podId !== podFilter) continue;

    const key = `${podId}|${studentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ studentId, podId });
  }

  return out;
}

export function supplementEnrollmentsFromAttendance(
  records: BobAttendance[],
  dates: string[],
  enrollments: ExpectedEnrollment[],
  studentById: Map<string, BobStudent>,
  podFilter?: string,
): ExpectedEnrollment[] {
  const dateSet = new Set(dates);
  const seen = new Set(enrollments.map((e) => `${e.podId}|${e.studentId}`));
  const out = [...enrollments];

  for (const r of records) {
    if (!r.studentId || !r.date || !dateSet.has(r.date)) continue;
    const studentId = String(r.studentId);
    const podId =
      (r.podId && String(r.podId)) ||
      studentById.get(studentId)?.podId ||
      UNASSIGNED_POD_ID;
    if (podFilter && podId !== podFilter) continue;

    const key = `${podId}|${studentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ studentId, podId });
  }

  return out;
}

export function buildStudentDayAttendance(
  records: BobAttendance[],
  enrollments: ExpectedEnrollment[],
  dates: string[],
  studentById: Map<string, BobStudent>,
): StudentDayAttendance[] {
  const punchEvents: BobAttendance[] = [];
  const dailyByKey = new Map<string, BobAttendance>();

  for (const r of records) {
    if (!r.date) continue;
    const studentId = r.studentId || "";
    if (!studentId) continue;

    if (isPunchEventRecord(r)) {
      punchEvents.push(r);
      continue;
    }
    const podId =
      r.podId || studentById.get(studentId)?.podId || UNASSIGNED_POD_ID;
    const dayKey = `${podId}|${studentId}|${r.date}`;
    if (isDailyAttendanceRecord(r) || r.status || isBaselineDailyRecord(r)) {
      const prev = dailyByKey.get(dayKey);
      if (shouldPreferDailyRecord(prev, r)) {
        dailyByKey.set(dayKey, r);
      }
    }
  }

  const days: StudentDayAttendance[] = [];

  for (const date of dates) {
    for (const { studentId, podId } of enrollments) {
      const key = `${podId}|${studentId}|${date}`;
      let punches = emptyPunches();

      for (const ev of punchEvents) {
        if (ev.studentId !== studentId || ev.date !== date) continue;
        const evPod =
          ev.podId || studentById.get(studentId)?.podId || podId;
        if (evPod !== podId) continue;
        const pt = normalizeSignType(ev.signType);
        if (!pt) continue;
        const timeLabel = formatAttendanceTime(ev.signInTime || ev.signOutTime);
        punches[pt] = {
          type: pt,
          state: "recorded",
          eventId: ev.id,
          timeLabel,
        };
      }

      const daily = dailyByKey.get(key);
      const attendanceState = mapAttendanceStateFromRecord(daily);

      if (daily) {
        populateDailyRecordPunches(punches, daily, attendanceState);
      }

      if (daily?.status) {
        punches = applyStatusToPunches(punches, daily.status);
      }

      const requiredPunches = expectedPunchTypes(date);
      if (isShowcaseDay(date)) {
        if (punches.am_in.state === "missing") {
          punches.am_in = { ...punches.am_in, state: "na" };
        }
        if (punches.am_out.state === "missing") {
          punches.am_out = { ...punches.am_out, state: "na" };
        }
      } else if (requiredPunches.length === 0) {
        // Outside program calendar — only gray out empty slots; keep synced punch times green.
        for (const pt of PUNCH_TYPES) {
          if (punches[pt].state === "missing") {
            punches[pt] = { ...punches[pt], state: "na" };
          }
        }
      }

      const { health, missingPunchCount, isLate } = deriveHealth(
        punches,
        attendanceState,
        daily?.status,
        date,
      );

      const morning = buildSession(
        punches,
        "am_in",
        "am_out",
        formatHoursLabel(daily?.amHours),
        attendanceState,
      );
      const afternoon = buildSession(
        punches,
        "pm_in",
        "pm_out",
        formatHoursLabel(daily?.pmHours),
        attendanceState,
      );

      const student = studentById.get(studentId);

      let totalHoursLabel =
        formatHoursLabel(daily?.hoursPresent) ||
        formatHoursLabel(daily?.totalHours);

      if (!totalHoursLabel && daily) {
        const computed = computeHoursPresentFromStaffTimes(
          date,
          toTimeInputValue(daily.signInTime || daily.adjustedSignIn),
          toTimeInputValue(daily.staffCorrectionSignOut || daily.manualEndTime),
          toTimeInputValue(daily.staffCorrectionSignIn || daily.manualStartTime),
          toTimeInputValue(daily.signOutTime || daily.adjustedSignOut),
        );
        if (computed > 0) {
          totalHoursLabel = formatHoursLabel(computed);
        }
      }

      days.push({
        key,
        studentId,
        podId,
        date,
        punches,
        morning,
        afternoon,
        attendanceState,
        dailyStatus: daily?.status,
        dailyRecordId: daily?.id,
        airtableRecordId: daily?.airtableRecordId ?? undefined,
        health,
        missingPunchCount,
        isLate,
        totalHoursLabel,
        expectedHoursLabel: formatHoursLabel(daily?.maxHours),
        program: daily?.program ?? undefined,
        site: daily?.branch ?? student?.site ?? undefined,
        branch: daily?.branch ?? undefined,
        track: daily?.track ?? student?.track ?? undefined,
        manualOverride: daily?.manualOverride ?? undefined,
        staffCorrectionSignIn: daily?.staffCorrectionSignIn ?? undefined,
        staffCorrectionSignOut: daily?.staffCorrectionSignOut ?? undefined,
        notes: daily?.notes ?? undefined,
        hasManualCorrection: Boolean(
          daily?.manualOverride ||
            daily?.staffCorrectionSignIn ||
            daily?.staffCorrectionSignOut,
        ),
        hasAutoFill: attendanceState === "auto_filled",
      });
    }
  }

  return days;
}
