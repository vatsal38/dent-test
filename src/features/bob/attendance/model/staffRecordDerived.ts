import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import { expectedHoursForDate } from "@/lib/bobProgramCalendar";
import type { BobAttendance } from "@/platform/api/bob/attendance";
import type { PunchType, StaffCorrections, StudentDayAttendance, FinalAttendanceRecord } from "../types";
import { combineDateAndTime, toTimeInputValue } from "./attendanceRecordTime";
import { formatAttendanceTime } from "./formatAttendanceTime";
import { formatHoursLabel } from "./formatAttendanceTime";

type StaffCorrectionDaily = Pick<
  BobAttendance,
  | "signInTime"
  | "staffCorrectionSignOut"
  | "staffCorrectionSignIn"
  | "manualStartTime"
  | "manualEndTime"
  | "manualOverride"
  | "signOutTime"
  | "adjustedSignOut"
  | "staffCorrectedByUserId"
  | "staffCorrectedByName"
  | "staffCorrectedAt"
>;

/** Youthwork / staff-entered overrides only — never Airtable auto-fill or adjusted rollup fields. */
export function hasExplicitStaffCorrection(
  daily?: StaffCorrectionDaily | null,
): boolean {
  return Boolean(
    daily?.staffCorrectionSignIn ||
      daily?.staffCorrectionSignOut ||
      daily?.manualStartTime ||
      daily?.manualEndTime ||
      daily?.manualOverride ||
      daily?.staffCorrectedByUserId,
  );
}

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
  daily: StaffCorrectionDaily | null | undefined,
): boolean {
  return Boolean(
    daily?.manualOverride &&
      daily.signInTime &&
      !isScheduledPlaceholderTime(daily.signInTime),
  );
}

export function staffMorningInInput(
  daily: StaffCorrectionDaily | null | undefined,
): string {
  if (daily?.signInTime && hasStaffMorningInCorrection(daily)) {
    return toTimeInputValue(daily.signInTime);
  }
  return "";
}

export function staffMorningOutInput(
  daily: StaffCorrectionDaily | null | undefined,
): string {
  if (daily?.staffCorrectionSignOut) {
    return toTimeInputValue(daily.staffCorrectionSignOut);
  }
  return "";
}

export function staffAfternoonInInput(
  daily: StaffCorrectionDaily | null | undefined,
): string {
  return toTimeInputValue(
    daily?.staffCorrectionSignIn || daily?.manualStartTime,
  );
}

export function hasStaffAfternoonOutCorrection(
  daily: StaffCorrectionDaily | null | undefined,
  day?: Pick<StudentDayAttendance, "punches">,
): boolean {
  if (!daily?.staffCorrectedByUserId) return false;
  const out = daily.signOutTime || daily.adjustedSignOut;
  if (!out) return false;
  const youthPmOut = day?.punches?.pm_out?.youthTimeIso;
  if (youthPmOut && sameIsoMoment(out, youthPmOut)) return false;
  return true;
}

export function staffAfternoonOutInput(
  daily: StaffCorrectionDaily | null | undefined,
  day?: Pick<StudentDayAttendance, "punches">,
): string {
  if (!hasStaffAfternoonOutCorrection(daily, day)) return "";
  return toTimeInputValue(daily?.signOutTime || daily?.adjustedSignOut);
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

function formatStaffTimeInput(
  date: string | undefined,
  timeInput: string,
): string | undefined {
  if (!date || !timeInput) return undefined;
  const iso = combineDateAndTime(date, timeInput);
  return iso ? formatAttendanceTime(iso) : undefined;
}

export function buildStaffCorrections(
  daily?: StaffCorrectionDaily | null,
  date?: string,
  day?: Pick<StudentDayAttendance, "punches">,
): StaffCorrections {
  const morningInStaff = formatStaffTimeInput(
    date,
    staffMorningInInput(daily),
  );
  const morningOutStaff = formatStaffTimeInput(
    date,
    staffMorningOutInput(daily),
  );
  const afternoonInStaff = formatStaffTimeInput(
    date,
    staffAfternoonInInput(daily),
  );
  const afternoonOutStaff = formatStaffTimeInput(
    date,
    staffAfternoonOutInput(daily, day),
  );

  const morning = {
    in: morningInStaff,
    out: morningOutStaff || undefined,
  };
  const afternoon = {
    in: afternoonInStaff || undefined,
    out: afternoonOutStaff,
  };

  const hasDisplayedCorrection = Boolean(
    morning.in || morning.out || afternoon.in || afternoon.out,
  );
  const hasCorrections =
    hasExplicitStaffCorrection(daily) && hasDisplayedCorrection;

  let hoursLabel: string | undefined;
  if (date && hasCorrections && day) {
    const hours = computeEffectiveHoursPresent(
      { ...(day as object), date } as StudentDayAttendance,
      {
        morningIn: staffMorningInInput(daily),
        morningOut: staffMorningOutInput(daily),
        afternoonIn: staffAfternoonInInput(daily),
        afternoonOut: staffAfternoonOutInput(daily, day),
      },
    );
    if (hours > 0) hoursLabel = `${hours}h`;
  }

  return {
    morning,
    afternoon,
    hasCorrections,
    hoursLabel,
    correctedByName: daily?.staffCorrectedByName || undefined,
    correctedAt: daily?.staffCorrectedAt || undefined,
  };
}

export function buildFinalAttendanceRecord(
  day: StudentDayAttendance,
  daily?: StaffCorrectionDaily | null,
): FinalAttendanceRecord {
  const morningIn = effectiveStaffTime(
    staffMorningInInput(daily),
    day,
    "am_in",
  );
  const morningOut = effectiveStaffTime(
    staffMorningOutInput(daily),
    day,
    "am_out",
  );
  const afternoonIn = effectiveStaffTime(
    staffAfternoonInInput(daily),
    day,
    "pm_in",
  );
  const afternoonOut = effectiveStaffTime(
    staffAfternoonOutInput(daily, day),
    day,
    "pm_out",
  );

  const morningHours = computeSessionHours(day.date, morningIn, morningOut);
  const afternoonHours = computeSessionHours(
    day.date,
    afternoonIn,
    afternoonOut,
  );
  const totalHours = computeEffectiveHoursPresent(day, {
    morningIn: staffMorningInInput(daily),
    morningOut: staffMorningOutInput(daily),
    afternoonIn: staffAfternoonInInput(daily),
    afternoonOut: staffAfternoonOutInput(daily, day),
  });

  const formatTime = (value: string) =>
    value ? formatAttendanceTime(combineDateAndTime(day.date, value)) : undefined;

  return {
    morning: {
      in: formatTime(morningIn),
      out: formatTime(morningOut),
      hours: morningHours > 0 ? formatHoursLabel(morningHours) : undefined,
    },
    afternoon: {
      in: formatTime(afternoonIn),
      out: formatTime(afternoonOut),
      hours: afternoonHours > 0 ? formatHoursLabel(afternoonHours) : undefined,
    },
    totalHours: totalHours > 0 ? formatHoursLabel(totalHours) : undefined,
    correctedByName: daily?.staffCorrectedByName || undefined,
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
