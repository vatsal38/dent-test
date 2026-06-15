import type { StudentDayAttendance } from "../types";

/** Whether a student-day row needs staff triage attention. */
export function dayHasTriageIssue(row: StudentDayAttendance): boolean {
  return (
    row.health === "missing" ||
    row.health === "partial" ||
    row.attendanceState === "missing_punch" ||
    row.isLate ||
    row.attendanceState === "late" ||
    row.hasManualCorrection ||
    row.attendanceState === "auto_filled" ||
    row.hasAutoFill ||
    Boolean(row.notes && /correction|request/i.test(row.notes))
  );
}

export function triageIssuePriority(row: StudentDayAttendance): number {
  if (row.attendanceState === "missing_punch" || row.health === "partial") {
    return 0;
  }
  if (row.attendanceState === "late" || row.isLate) return 1;
  if (row.hasManualCorrection) return 2;
  if (row.attendanceState === "auto_filled" || row.hasAutoFill) return 3;
  if (row.health === "missing") return 4;
  if (row.notes && /correction|request/i.test(row.notes)) return 5;
  return 6;
}
