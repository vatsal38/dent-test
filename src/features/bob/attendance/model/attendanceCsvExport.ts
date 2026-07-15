import type { BobStudent } from "@/platform/api/bob/students";
import { studentDisplayName } from "@/features/bob/roster/recordDisplay";
import type { AttendanceWorkspaceData, StudentDayAttendance } from "../types";
import {
  ATTENDANCE_STATE_LABELS,
  DAY_HEALTH_STYLES,
  STATUS_LABELS,
} from "./constants";
import { formatDayHoursPresent } from "./dayHours";
import { resolveAttendanceStaffNote } from "./attendanceStaffNotes";
import { syncedPunchLabel } from "./staffRecordDerived";

/** Normalize time labels for CSV (drop blank / broken object strings). */
export function csvTimeLabel(value?: string | null): string {
  const s = String(value || "").trim();
  if (!s || s === "—" || s === "[object Object]") return "";
  return s;
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/** Columns match the daily attendance table detail (status, hours, youth, staff, final, notes). */
export const ATTENDANCE_CSV_HEADERS = [
  "Date",
  "Track",
  "Student",
  "Status",
  "Health",
  "Hours today",
  "Program hours",
  "Daily status",
  "Late",
  // Youth sign-in
  "Youth AM In",
  "Youth AM Out",
  "Youth PM In",
  "Youth PM Out",
  "Morning hours",
  "Afternoon hours",
  // Staff corrections (actual times — not just Yes/No)
  "Staff AM In",
  "Staff AM Out",
  "Staff PM In",
  "Staff PM Out",
  "Staff corrected hours",
  "Corrected by",
  // Final record (youth + staff merged)
  "Final AM In",
  "Final AM Out",
  "Final PM In",
  "Final PM Out",
  "Final morning hours",
  "Final afternoon hours",
  "Final total hours",
  "Missing punches",
  "Notes",
] as const;

export function buildAttendanceCsvRow(
  day: StudentDayAttendance,
  workspace: Pick<AttendanceWorkspaceData, "studentById" | "podById">,
): string[] {
  const student = workspace.studentById.get(day.studentId);
  const pod = workspace.podById.get(day.podId);
  const name = student ? studentDisplayName(student) : "Unknown";
  const programHours = student?.attendanceStats?.hoursAttended;
  const staff = day.staffCorrections;
  const final = day.finalRecord;
  const dailyStatus =
    day.dailyStatus && STATUS_LABELS[day.dailyStatus]
      ? STATUS_LABELS[day.dailyStatus]
      : day.dailyStatus || "";

  return [
    day.date,
    pod?.name ?? day.track ?? "",
    name,
    ATTENDANCE_STATE_LABELS[day.attendanceState] || day.attendanceState || "",
    DAY_HEALTH_STYLES[day.health]?.label ?? day.health ?? "",
    formatDayHoursPresent(day),
    programHours != null ? `${programHours}h` : "",
    dailyStatus,
    day.isLate ? "Yes" : "No",
    // Youth
    csvTimeLabel(syncedPunchLabel(day, "am_in")),
    csvTimeLabel(syncedPunchLabel(day, "am_out")),
    csvTimeLabel(syncedPunchLabel(day, "pm_in")),
    csvTimeLabel(syncedPunchLabel(day, "pm_out")),
    day.morning.hoursLabel || "",
    day.afternoon.hoursLabel || "",
    // Staff corrections detail
    csvTimeLabel(staff.morning.in),
    csvTimeLabel(staff.morning.out),
    csvTimeLabel(staff.afternoon.in),
    csvTimeLabel(staff.afternoon.out),
    staff.hoursLabel || "",
    staff.correctedByName || final.correctedByName || "",
    // Final record
    csvTimeLabel(final.morning.in),
    csvTimeLabel(final.morning.out),
    csvTimeLabel(final.afternoon.in),
    csvTimeLabel(final.afternoon.out),
    final.morning.hours || "",
    final.afternoon.hours || "",
    final.totalHours || formatDayHoursPresent(day),
    String(day.missingPunchCount ?? 0),
    resolveAttendanceStaffNote(day) || "",
  ];
}

export function buildAttendanceCsv(
  days: StudentDayAttendance[],
  workspace: Pick<AttendanceWorkspaceData, "studentById" | "podById">,
): string {
  const rows = days.map((d) =>
    buildAttendanceCsvRow(d, workspace).map(escapeCsvCell).join(","),
  );
  return [ATTENDANCE_CSV_HEADERS.join(","), ...rows].join("\n");
}

/** Convenience for tests / callers that only have a student map. */
export function studentProgramHoursLabel(student?: BobStudent | null): string {
  const hours = student?.attendanceStats?.hoursAttended;
  return hours != null ? `${hours}h` : "";
}
