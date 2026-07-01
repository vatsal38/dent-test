"use client";

import { useMemo } from "react";
import type { BobAttendance } from "@/platform/api/bob/attendance";
import type { BobStudent } from "@/platform/api/bob/students";
import {
  buildStudentDayAttendance,
  UNASSIGNED_POD_ID,
} from "@/features/bob/attendance/model/buildAttendanceIndex";
import type { StudentDayAttendance } from "@/features/bob/attendance/types";

export function buildStudentAttendanceDays(
  student: BobStudent,
  records: BobAttendance[],
): StudentDayAttendance[] {
  const dates = [
    ...new Set(
      records
        .map((row) => String(row.date || "").slice(0, 10))
        .filter(Boolean),
    ),
  ].sort();
  if (!dates.length) return [];

  const studentById = new Map([[student.id, student]]);
  const podId = student.podId || UNASSIGNED_POD_ID;
  return buildStudentDayAttendance(
    records,
    [{ studentId: student.id, podId }],
    dates,
    studentById,
  );
}

export function sortStudentDaysNewestFirst(
  days: StudentDayAttendance[],
): StudentDayAttendance[] {
  return [...days].sort((a, b) => b.date.localeCompare(a.date));
}
