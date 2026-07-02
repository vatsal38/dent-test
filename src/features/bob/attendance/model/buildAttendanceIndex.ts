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
  computeEffectiveHoursPresent,
  buildStaffCorrections,
  buildFinalAttendanceRecord,
  computeHoursPresentFromPunchSlots,
  computeSessionHoursFromPunches,
  hasExplicitStaffCorrection,
  isScheduledPlaceholderTime,
  staffAfternoonInInput,
  staffAfternoonOutInput,
  staffMorningInInput,
  staffMorningOutInput,
} from "./staffRecordDerived";
import { toTimeInputValue } from "./attendanceRecordTime";
import {
  expectedPunchTypes,
  expectedHoursForDate,
  isAttendanceExpectedOn,
  isProgramDay,
  isShowcaseDay,
} from "@/lib/bobProgramCalendar";
import {
  isDailyAttendanceRecord,
  isPunchEventRecord,
  normalizeSignType,
  punchEventTimeIso,
} from "./normalizeSignType";
import {
  mapAttendanceStateFromRecord,
  sessionStatusLabel,
} from "./mapAttendanceState";
import { hasStaffAnnotation, mergeStaffAnnotations } from "./attendanceStaffNotes";

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
    if (next[pt].state !== "missing") continue;
    const hasTime = isUsableTimeLabel(next[pt].timeLabel);
    if (status === "present" && !hasTime) continue;
    next[pt] = { ...next[pt], state: mapState(pt) };
  }
  return next;
}

function isUsableTimeLabel(value?: string | null): value is string {
  if (!value) return false;
  const raw = String(value).trim();
  return Boolean(raw) && raw !== "[object Object]";
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
    force?: boolean;
  },
) {
  const existing = punches[pt];
  const hasPunch =
    existing.state === "recorded" &&
    (isUsableTimeLabel(existing.timeLabel) ||
      isUsableTimeLabel(existing.originalTimeLabel) ||
      isUsableTimeLabel(existing.adjustedTimeLabel));
  if (hasPunch && !opts.force) return;

  punches[pt] = {
    type: pt,
    state: opts.state ?? "recorded",
    eventId: opts.eventId ?? existing.eventId,
    timeLabel: isUsableTimeLabel(opts.display) ? opts.display : undefined,
    originalTimeLabel: isUsableTimeLabel(opts.original) ? opts.original : undefined,
    adjustedTimeLabel: isUsableTimeLabel(opts.adjusted) ? opts.adjusted : undefined,
    adjustmentReason: opts.reason,
    adjustmentSource: opts.source,
  };
}

function punchBelongsToEnrollment(
  ev: BobAttendance,
  studentId: string,
  podId: string,
  studentById: Map<string, BobStudent>,
): boolean {
  if (ev.studentId !== studentId) return false;
  const recordPod = ev.podId ? String(ev.podId) : null;
  if (!recordPod || recordPod === UNASSIGNED_POD_ID) return true;
  const studentPod = studentById.get(studentId)?.podId;
  if (studentPod && String(studentPod) === recordPod) return true;
  return recordPod === podId;
}

function isLowTrustRollupHours(value?: string | null): boolean {
  if (!value) return true;
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  return !Number.isFinite(n) || n < 0.25;
}

function parseLocalMinutesFromIso(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

/** After morning block — assign ambiguous master sign-out to afternoon when appropriate. */
function isAfternoonSignOutTime(value?: string | null): boolean {
  const minutes = parseLocalMinutesFromIso(value);
  if (minutes == null) return false;
  return minutes >= 13 * 60;
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
  const staffCorrection = Boolean(
    daily.manualOverride ||
      daily.staffCorrectionSignIn ||
      daily.staffCorrectionSignOut ||
      daily.manualStartTime ||
      daily.manualEndTime,
  );

  if ((amInDisplay || amInOriginal) && !isScheduledPlaceholderTime(daily.signInTime)) {
    setPunchTime(punches, "am_in", {
      display: amInDisplay || amInOriginal,
      original: amInOriginal,
      adjusted: amInAdjusted,
      eventId: daily.id,
      state: punchState === "missing" ? "recorded" : punchState,
      reason: amInAdjusted && amInOriginal !== amInAdjusted ? correctionSource : undefined,
      source: amInAdjusted ? correctionSource : undefined,
      force: staffCorrection,
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
      force: true,
    });
  } else if (pmOutDisplay || pmOutOriginal) {
    const signOutIso =
      daily.adjustedSignOut || daily.signOutTime || daily.rawSignOutTime || null;
    const signInIso = daily.adjustedSignIn || daily.signInTime || daily.rawSignInTime || null;
    const rollupLooksBogus =
      isScheduledPlaceholderTime(signInIso) &&
      signOutIso &&
      signInIso &&
      Math.abs(new Date(signOutIso).getTime() - new Date(signInIso).getTime()) < 45 * 60 * 1000;
    if (!rollupLooksBogus) {
      const outType = isAfternoonSignOutTime(signOutIso) ? "pm_out" : "am_out";
      setPunchTime(punches, outType, {
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

  if (manualStart || staffIn) {
    setPunchTime(punches, "pm_in", {
      display: staffIn || manualStart,
      original: manualStart,
      adjusted: staffIn,
      state: punchState,
      reason: staffIn ? correctionSource : undefined,
      source: staffIn ? correctionSource : undefined,
      force: true,
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
  computedHours = 0,
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
  const payrollReady =
    computedHours >= 1.5 ||
    (computedHours >= 0.5 &&
      (attendanceState === "present" ||
        dailyStatus === "present" ||
        attendanceState === "late" ||
        dailyStatus === "late"));
  if (payrollReady && missingPunchCount === 0)
    return { health: "complete", missingPunchCount, isLate };
  if (payrollReady && missingPunchCount > 0)
    return { health: "complete", missingPunchCount, isLate };
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
  const dayRecordsByKey = new Map<string, BobAttendance[]>();

  function rememberDayRecord(dayKey: string, record: BobAttendance) {
    const list = dayRecordsByKey.get(dayKey) || [];
    list.push(record);
    dayRecordsByKey.set(dayKey, list);
  }

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
    rememberDayRecord(dayKey, r);

    if (
      isDailyAttendanceRecord(r) ||
      r.status ||
      isBaselineDailyRecord(r) ||
      hasStaffAnnotation(r)
    ) {
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
        if (ev.date !== date) continue;
        if (!punchBelongsToEnrollment(ev, studentId, podId, studentById)) continue;
        const pt = normalizeSignType(ev.signType);
        if (!pt) continue;
        const timeIso = punchEventTimeIso(ev, pt);
        const timeLabel = formatAttendanceTime(timeIso);
        if (!timeLabel) continue;
        punches[pt] = {
          type: pt,
          state: "recorded",
          eventId: ev.id,
          timeLabel,
          youthTimeIso: timeIso,
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
        for (const pt of PUNCH_TYPES) {
          if (punches[pt].state === "missing") {
            punches[pt] = { ...punches[pt], state: "na" };
          }
        }
      }

      const punchHours = computeHoursPresentFromPunchSlots(date, punches);
      const morningHours = computeSessionHoursFromPunches(date, punches, "am_in", "am_out");
      const afternoonHours = computeSessionHoursFromPunches(date, punches, "pm_in", "pm_out");

      const { health, missingPunchCount, isLate } = deriveHealth(
        punches,
        attendanceState,
        daily?.status,
        date,
        punchHours,
      );

      const morning = buildSession(
        punches,
        "am_in",
        "am_out",
        morningHours > 0 ? formatHoursLabel(morningHours) : formatHoursLabel(daily?.amHours),
        attendanceState,
      );
      const afternoon = buildSession(
        punches,
        "pm_in",
        "pm_out",
        afternoonHours > 0 ? formatHoursLabel(afternoonHours) : formatHoursLabel(daily?.pmHours),
        attendanceState,
      );

      const student = studentById.get(studentId);

      let totalHoursLabel =
        punchHours > 0
          ? formatHoursLabel(punchHours)
          : formatHoursLabel(daily?.hoursPresent) || formatHoursLabel(daily?.totalHours);

      if (
        (!totalHoursLabel || isLowTrustRollupHours(daily?.hoursPresent)) &&
        daily
      ) {
        const computed = computeEffectiveHoursPresent(
          { date, punches } as StudentDayAttendance,
          {
            morningIn: staffMorningInInput(daily),
            morningOut: staffMorningOutInput(daily),
            afternoonIn: staffAfternoonInInput(daily),
            afternoonOut: staffAfternoonOutInput(daily, { punches }),
          },
        );
        if (computed > 0) {
          totalHoursLabel = formatHoursLabel(computed);
        }
      }

      const staffAnnotations = mergeStaffAnnotations(
        dayRecordsByKey.get(key) || (daily ? [daily] : []),
      );

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
        expectedHoursLabel: formatHoursLabel(
          expectedHoursForDate(date) || daily?.maxHours,
        ),
        program: daily?.program ?? undefined,
        site: daily?.branch ?? student?.site ?? undefined,
        branch: daily?.branch ?? undefined,
        track: daily?.track ?? student?.track ?? undefined,
        manualOverride:
          staffAnnotations.manualOverride ?? daily?.manualOverride ?? undefined,
        staffCorrectionSignIn: daily?.staffCorrectionSignIn ?? undefined,
        staffCorrectionSignOut: daily?.staffCorrectionSignOut ?? undefined,
        notes: staffAnnotations.notes ?? daily?.notes ?? undefined,
        hasManualCorrection: hasExplicitStaffCorrection(daily),
        hasAutoFill: attendanceState === "auto_filled",
        staffCorrections: buildStaffCorrections(daily, date, { punches }),
        finalRecord: buildFinalAttendanceRecord(
          {
            date,
            punches,
            morning,
            afternoon,
          } as StudentDayAttendance,
          daily,
        ),
      });
    }
  }

  return days;
}
