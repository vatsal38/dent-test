import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import { expectedHoursForDate } from "@/lib/bobProgramCalendar";
import type { BobAttendance } from "@/platform/api/bob/attendance";
import type { PunchType, StaffCorrections, StudentDayAttendance } from "../types";
import { combineDateAndTime, toTimeInputValue } from "./attendanceRecordTime";
import { formatAttendanceTime } from "./formatAttendanceTime";

const STATUS_LABELS: Record<BobAttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  excused: "Excused",
  absent: "Absent",
};

export function deriveAttendanceStatusLabel(
  status: BobAttendanceStatus | "",
  day: StudentDayAttendance,
): string {
  if (status && STATUS_LABELS[status]) return STATUS_LABELS[status];
  switch (day.attendanceState) {
    case "present":
      return "Present";
    case "late":
      return "Late";
    case "excused":
      return "Excused";
    case "absent":
      return "Absent";
    case "auto_filled":
      return "Auto filled";
    case "missing_punch":
      return "Missing punch";
    default:
      return "—";
  }
}

function hoursBetween(date: string, inTime: string, outTime: string): number {
  const start = combineDateAndTime(date, inTime);
  const end = combineDateAndTime(date, outTime);
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round((ms / 3600000) * 100) / 100;
}

export function computeSessionHours(
  date: string,
  inTime: string,
  outTime: string,
): number {
  return hoursBetween(date, inTime, outTime);
}

export function computeHoursPresentFromStaffTimes(
  date: string,
  morningIn: string,
  morningOut: string,
  afternoonIn: string,
  afternoonOut: string,
): number {
  const morning = hoursBetween(date, morningIn, morningOut);
  const afternoon = hoursBetween(date, afternoonIn, afternoonOut);
  const total = Math.round((morning + afternoon) * 100) / 100;
  const cap = expectedHoursForDate(date);
  if (cap > 0 && total > cap) return cap;
  return total;
}

export function syncedTimeInput(
  day: StudentDayAttendance,
  punch: PunchType,
): string {
  return toTimeInputValue(day.punches[punch].youthTimeIso);
}

export function effectiveStaffTime(
  staffInput: string,
  day: StudentDayAttendance,
  punch: PunchType,
): string {
  if (String(staffInput || "").trim()) return staffInput;
  return syncedTimeInput(day, punch);
}

export function computeEffectiveHoursPresent(
  day: StudentDayAttendance,
  staff: {
    morningIn: string;
    morningOut: string;
    afternoonIn: string;
    afternoonOut: string;
  },
): number {
  return computeHoursPresentFromStaffTimes(
    day.date,
    effectiveStaffTime(staff.morningIn, day, "am_in"),
    effectiveStaffTime(staff.morningOut, day, "am_out"),
    effectiveStaffTime(staff.afternoonIn, day, "pm_in"),
    effectiveStaffTime(staff.afternoonOut, day, "pm_out"),
  );
}

export function formatHoursValue(hours: number): string {
  if (!hours || hours <= 0) return "0";
  return String(hours);
}

/** Staff correction slots — overrides only; blank slots fall back to youth punches for hours. */
export function buildStaffCorrections(
  daily?: Pick<
    BobAttendance,
    | "signInTime"
    | "adjustedSignIn"
    | "staffCorrectionSignOut"
    | "manualEndTime"
    | "staffCorrectionSignIn"
    | "manualStartTime"
    | "adjustedSignOut"
    | "signOutTime"
    | "manualOverride"
  > | null,
  date?: string,
  day?: Pick<StudentDayAttendance, "punches">,
): StaffCorrections {
  const morningInStaff = formatAttendanceTime(daily?.signInTime);
  const morningOutStaff = formatAttendanceTime(
    daily?.staffCorrectionSignOut || daily?.manualEndTime,
  );
  const afternoonInStaff = formatAttendanceTime(
    daily?.staffCorrectionSignIn || daily?.manualStartTime,
  );
  const afternoonOutStaff = formatAttendanceTime(
    daily?.adjustedSignOut || daily?.signOutTime,
  );

  const youthLabel = (punch: PunchType) =>
    day ? formatAttendanceTime(day.punches[punch].youthTimeIso) : undefined;

  const morningIn = morningInStaff || youthLabel("am_in");
  const morningOut = morningOutStaff || youthLabel("am_out");
  const afternoonIn = afternoonInStaff || youthLabel("pm_in");
  const afternoonOut = afternoonOutStaff || youthLabel("pm_out");

  const hasCorrections = Boolean(
    daily?.manualOverride ||
      daily?.staffCorrectionSignIn ||
      daily?.staffCorrectionSignOut ||
      daily?.manualStartTime ||
      daily?.manualEndTime ||
      daily?.signInTime ||
      daily?.adjustedSignOut ||
      daily?.signOutTime,
  );

  let hoursLabel: string | undefined;
  if (date && hasCorrections && day) {
    const hours = computeEffectiveHoursPresent(day as StudentDayAttendance, {
      morningIn: toTimeInputValue(daily?.signInTime),
      morningOut: toTimeInputValue(
        daily?.staffCorrectionSignOut || daily?.manualEndTime,
      ),
      afternoonIn: toTimeInputValue(
        daily?.staffCorrectionSignIn || daily?.manualStartTime,
      ),
      afternoonOut: toTimeInputValue(
        daily?.adjustedSignOut || daily?.signOutTime,
      ),
    });
    if (hours > 0) hoursLabel = `${hours}h`;
  }

  return {
    morning: { in: morningIn, out: morningOut },
    afternoon: { in: afternoonIn, out: afternoonOut },
    hasCorrections,
    hoursLabel,
  };
}

export function syncedPunchLabel(
  day: StudentDayAttendance,
  punch: PunchType,
): string {
  const slot = day.punches[punch];
  const candidates = [
    slot.timeLabel,
    slot.adjustedTimeLabel,
    slot.originalTimeLabel,
  ];
  for (const label of candidates) {
    if (label && label !== "[object Object]") return label;
  }
  return "—";
}
