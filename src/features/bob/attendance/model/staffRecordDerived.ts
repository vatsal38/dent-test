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

/** Daily master often stores 4:00 PM Eastern (= 20:00 UTC) as a placeholder sign-in. */
export function isScheduledPlaceholderTime(value?: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCHours() === 20 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
}

function hoursBetweenIso(date: string, inIso?: string | null, outIso?: string | null): number {
  if (!inIso || !outIso) return 0;
  if (isScheduledPlaceholderTime(inIso)) return 0;
  return hoursBetween(date, toTimeInputValue(inIso), toTimeInputValue(outIso));
}

export function computeSessionHoursFromPunches(
  date: string,
  punches: StudentDayAttendance["punches"],
  inType: PunchType,
  outType: PunchType,
): number {
  return hoursBetweenIso(date, punches[inType].youthTimeIso, punches[outType].youthTimeIso);
}

/** Payroll hours from youth sign-in/out punches (capped at program day max, usually 5h). */
export function computeHoursPresentFromPunchSlots(
  date: string,
  punches: StudentDayAttendance["punches"],
): number {
  const morning = computeSessionHoursFromPunches(date, punches, "am_in", "am_out");
  const afternoon = computeSessionHoursFromPunches(date, punches, "pm_in", "pm_out");
  const total = Math.round((morning + afternoon) * 100) / 100;
  const cap = expectedHoursForDate(date);
  if (cap > 0 && total > cap) return cap;
  return total;
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

function sameIsoMoment(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  return Number.isFinite(left) && Number.isFinite(right) && left === right;
}

export function hasStaffMorningInCorrection(
  daily:
    | Pick<
        BobAttendance,
        "signInTime" | "manualOverride" | "adjustedSignIn" | "rawSignInTime"
      >
    | null
    | undefined,
): boolean {
  if (!daily?.signInTime || isScheduledPlaceholderTime(daily.signInTime)) return false;
  if (daily.manualOverride) return true;
  if (daily.adjustedSignIn && !sameIsoMoment(daily.adjustedSignIn, daily.rawSignInTime)) {
    return true;
  }
  return Boolean(
    daily.rawSignInTime && !sameIsoMoment(daily.signInTime, daily.rawSignInTime),
  );
}

export function staffMorningInInput(
  daily:
    | Pick<
        BobAttendance,
        "signInTime" | "manualOverride" | "adjustedSignIn" | "rawSignInTime"
      >
    | null
    | undefined,
): string {
  if (daily?.signInTime && hasStaffMorningInCorrection(daily)) {
    return toTimeInputValue(daily.signInTime);
  }
  return "";
}

export function hasStaffAfternoonOutCorrection(
  daily:
    | Pick<BobAttendance, "signOutTime" | "adjustedSignOut" | "rawSignOutTime">
    | null
    | undefined,
): boolean {
  if (daily?.adjustedSignOut) return true;
  return Boolean(
    daily?.signOutTime &&
      daily?.rawSignOutTime &&
      !sameIsoMoment(daily.signOutTime, daily.rawSignOutTime),
  );
}

export function staffAfternoonOutInput(
  daily:
    | Pick<BobAttendance, "signOutTime" | "adjustedSignOut" | "rawSignOutTime">
    | null
    | undefined,
): string {
  if (!hasStaffAfternoonOutCorrection(daily)) return "";
  return toTimeInputValue(daily?.adjustedSignOut || daily?.signOutTime);
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

/** Staff correction slots — staff-entered overrides only (never youth punch fallbacks). */
export function buildStaffCorrections(
  daily?: Pick<
    BobAttendance,
    | "signInTime"
    | "rawSignInTime"
    | "adjustedSignIn"
    | "staffCorrectionSignOut"
    | "manualEndTime"
    | "staffCorrectionSignIn"
    | "manualStartTime"
    | "adjustedSignOut"
    | "signOutTime"
    | "rawSignOutTime"
    | "manualOverride"
    | "staffCorrectedByName"
    | "staffCorrectedAt"
  > | null,
  date?: string,
  day?: Pick<StudentDayAttendance, "punches">,
): StaffCorrections {
  const hasStaffMorningIn = hasStaffMorningInCorrection(daily);
  const morningInStaff = hasStaffMorningIn
    ? formatAttendanceTime(daily?.signInTime)
    : undefined;
  const morningOutStaff = formatAttendanceTime(
    daily?.staffCorrectionSignOut || daily?.manualEndTime,
  );
  const afternoonInStaff = formatAttendanceTime(
    daily?.staffCorrectionSignIn || daily?.manualStartTime,
  );
  const afternoonOutStaff = hasStaffAfternoonOutCorrection(daily)
    ? formatAttendanceTime(daily?.adjustedSignOut || daily?.signOutTime)
    : undefined;

  const hasCorrections = Boolean(
    hasStaffMorningIn ||
      daily?.staffCorrectionSignIn ||
      daily?.staffCorrectionSignOut ||
      daily?.manualStartTime ||
    daily?.manualEndTime ||
    afternoonOutStaff,
  );

  const morning = {
    in: morningInStaff,
    out: morningOutStaff,
  };
  const afternoon = {
    in: afternoonInStaff,
    out: afternoonOutStaff,
  };

  const hasDisplayedCorrection = Boolean(
    morning.in || morning.out || afternoon.in || afternoon.out,
  );

  let hoursLabel: string | undefined;
  if (date && hasCorrections && hasDisplayedCorrection && day) {
    const hours = computeEffectiveHoursPresent(
      { ...(day as object), date } as StudentDayAttendance,
      {
        morningIn: toTimeInputValue(
          hasStaffMorningIn ? daily?.signInTime : undefined,
        ),
        morningOut: toTimeInputValue(
          daily?.staffCorrectionSignOut || daily?.manualEndTime,
        ),
        afternoonIn: toTimeInputValue(
          daily?.staffCorrectionSignIn || daily?.manualStartTime,
        ),
        afternoonOut: staffAfternoonOutInput(daily),
      },
    );
    if (hours > 0) hoursLabel = `${hours}h`;
  }

  return {
    morning,
    afternoon,
    hasCorrections: hasCorrections && hasDisplayedCorrection,
    hoursLabel,
    correctedByName: daily?.staffCorrectedByName || undefined,
    correctedAt: daily?.staffCorrectedAt || undefined,
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
