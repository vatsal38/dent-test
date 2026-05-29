import type { BobAttendance, BobAttendanceStatus } from "@/platform/api/bob/attendance";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import {
  PUNCH_TYPES,
  type DayHealth,
  type PunchSlot,
  type PunchType,
  type PunchVisualState,
  type StudentDayAttendance,
} from "../types";
import { isPunchEventRecord, normalizeSignType } from "./normalizeSignType";

function emptyPunches(): Record<PunchType, PunchSlot> {
  return Object.fromEntries(
    PUNCH_TYPES.map((t) => [t, { type: t, state: "missing" as PunchVisualState }]),
  ) as Record<PunchType, PunchSlot>;
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

function deriveHealth(
  punches: Record<PunchType, PunchSlot>,
  dailyStatus?: BobAttendanceStatus,
): { health: DayHealth; missingPunchCount: number; isLate: boolean } {
  const states = PUNCH_TYPES.map((t) => punches[t].state);
  const missingPunchCount = states.filter((s) => s === "missing").length;
  const isLate =
    dailyStatus === "late" || states.some((s) => s === "late");

  if (dailyStatus === "absent" || states.every((s) => s === "absent"))
    return { health: "absent", missingPunchCount, isLate };
  if (dailyStatus === "excused" || states.every((s) => s === "excused"))
    return { health: "excused", missingPunchCount, isLate };
  if (isLate && missingPunchCount === 0)
    return { health: "late", missingPunchCount, isLate };
  if (missingPunchCount === 0 && states.every((s) => s === "recorded" || s === "late"))
    return { health: "complete", missingPunchCount, isLate };
  if (missingPunchCount === PUNCH_TYPES.length)
    return { health: "missing", missingPunchCount, isLate };
  return { health: "partial", missingPunchCount, isLate };
}

export interface ExpectedEnrollment {
  studentId: string;
  podId: string;
}

/** Rows for Airtable-imported students not yet on a pod roster. */
export const UNASSIGNED_POD_ID = "__unassigned__";

export function isAirtableSourcedAttendance(record: BobAttendance): boolean {
  return Boolean(record.airtableRecordId && String(record.airtableRecordId).trim());
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

/** Include students who have attendance in range but are not on a pod roster. */
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

/**
 * Merge punch events + daily rollup records into per-student-day attendance.
 * Preserves Airtable event rows and manual status records from existing APIs.
 */
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
    if (r.status) {
      const podId =
        r.podId ||
        studentById.get(studentId)?.podId ||
        UNASSIGNED_POD_ID;
      dailyByKey.set(`${podId}|${studentId}|${r.date}`, r);
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
        const timeLabel = ev.signInTime || ev.signOutTime || undefined;
        punches[pt] = {
          type: pt,
          state: "recorded",
          eventId: ev.id,
          timeLabel,
        };
      }

      const daily = dailyByKey.get(key);
      if (daily?.status) {
        punches = applyStatusToPunches(punches, daily.status);
      }

      const { health, missingPunchCount, isLate } = deriveHealth(
        punches,
        daily?.status,
      );

      days.push({
        key,
        studentId,
        podId,
        date,
        punches,
        dailyStatus: daily?.status,
        dailyRecordId: daily?.id,
        health,
        missingPunchCount,
        isLate,
      });
    }
  }

  return days;
}
