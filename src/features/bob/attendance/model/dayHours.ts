import type { StudentDayAttendance } from "../types";

export function parseHoursLabel(label?: string | null): number {
  if (!label) return 0;
  const n = Number(String(label).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function resolveDayHoursNumeric(day: StudentDayAttendance): number {
  let attended = parseHoursLabel(day.totalHoursLabel);
  if (attended <= 0) {
    attended =
      parseHoursLabel(day.morning.hoursLabel) +
      parseHoursLabel(day.afternoon.hoursLabel);
  }
  return Math.round(attended * 100) / 100;
}

export function formatDayHoursPresent(day: StudentDayAttendance): string {
  const hours = resolveDayHoursNumeric(day);
  if (hours <= 0 && (day.health === "absent" || day.attendanceState === "absent")) {
    return "0h";
  }
  if (hours <= 0 && (day.health === "excused" || day.attendanceState === "excused")) {
    return "—";
  }
  if (hours <= 0) return "—";
  return `${hours}h`;
}

export function sumDayHours(days: StudentDayAttendance[]): number {
  return Math.round(days.reduce((sum, d) => sum + resolveDayHoursNumeric(d), 0) * 100) / 100;
}

export function formatHoursTotal(hours: number): string {
  if (hours <= 0) return "—";
  return `${hours}h`;
}
