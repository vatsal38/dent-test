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

function easternHoursMinutes(value: string): { hour: number; minute: number } | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    return { hour: h, minute: m };
  }
  const twelveHour = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let h = Number(twelveHour[1]);
    const m = Number(twelveHour[2]);
    const ampm = twelveHour[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return { hour: h, minute: m };
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(d);
    let hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if (hour === 24) hour = 0;
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return { hour, minute };
  } catch {
    return { hour: d.getHours(), minute: d.getMinutes() };
  }
}

/** Daily master often stores 4:00 PM Eastern (= 20:00 UTC) as a placeholder sign-in. */
export function isScheduledPlaceholderTime(value?: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCHours() === 20 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
}

/**
 * Airtable autofills when youth forgets to punch out:
 * - 12:30 (morning session end)
 * - 6:30 PM (common afternoon autofill; program ends 4:00 PM)
 * These must never appear as staff corrections.
 */
export function isScheduleAutofillTime(value?: string | null): boolean {
  if (!value) return false;
  const hm = easternHoursMinutes(String(value));
  if (!hm) return false;
  return (
    (hm.hour === 12 && hm.minute === 30) ||
    (hm.hour === 18 && hm.minute === 30)
  );
}

/** @deprecated Prefer isScheduleAutofillTime — kept for 6:30 PM-specific call sites. */
export function isDefaultAfternoonOutTime(value?: string | null): boolean {
  if (!value) return false;
  const hm = easternHoursMinutes(String(value));
  if (!hm) return false;
  return hm.hour === 18 && hm.minute === 30;
}

/** Youthwork / staff-entered overrides only — never Airtable auto-fill placeholders. */
export function hasExplicitStaffCorrection(
  daily?: StaffCorrectionDaily | null,
): boolean {
  if (daily?.staffCorrectedByUserId) return true;
  if (String(daily?.manualOverride || "").trim()) return true;

  const candidates = [
    daily?.staffCorrectionSignIn,
    daily?.staffCorrectionSignOut,
    daily?.manualStartTime,
    daily?.manualEndTime,
  ];
  return candidates.some(
    (t) =>
      Boolean(t) &&
      !isScheduledPlaceholderTime(t) &&
      !isScheduleAutofillTime(t),
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

function hoursBetweenIso(date: string, inIso?: string | null, outIso?: string | null): number {
  if (!inIso || !outIso) return 0;
  if (isScheduledPlaceholderTime(inIso)) return 0;
  if (isScheduleAutofillTime(outIso) || isScheduleAutofillTime(inIso)) return 0;
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
  const iso = day.punches[punch].youthTimeIso;
  if (punch === "pm_out" && isDefaultAfternoonOutTime(iso)) return "";
  return toTimeInputValue(iso);
}

export function effectiveStaffTime(
  staffInput: string,
  day: StudentDayAttendance,
  punch: PunchType,
): string {
  const entered = String(staffInput || "").trim();
  if (entered) {
    if (punch === "pm_out" && isDefaultAfternoonOutTime(entered)) return "";
    return entered;
  }
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
  if (
    daily?.staffCorrectionSignOut &&
    !isScheduleAutofillTime(daily.staffCorrectionSignOut) &&
    !isScheduledPlaceholderTime(daily.staffCorrectionSignOut)
  ) {
    return toTimeInputValue(daily.staffCorrectionSignOut);
  }
  return "";
}

export function staffAfternoonInInput(
  daily: StaffCorrectionDaily | null | undefined,
): string {
  const raw = daily?.staffCorrectionSignIn || daily?.manualStartTime;
  if (
    raw &&
    !isScheduleAutofillTime(raw) &&
    !isScheduledPlaceholderTime(raw)
  ) {
    return toTimeInputValue(raw);
  }
  return "";
}

export function hasStaffAfternoonOutCorrection(
  daily: StaffCorrectionDaily | null | undefined,
  day?: Pick<StudentDayAttendance, "punches">,
): boolean {
  // Show staff PM out when YouthWorks saved a correction (staffCorrectedByUserId),
  // or when sign-out differs from youth and is not an autofill placeholder.
  const out = daily?.signOutTime || daily?.adjustedSignOut;
  if (!out || isScheduleAutofillTime(out) || isScheduledPlaceholderTime(out)) {
    return false;
  }
  if (daily?.staffCorrectedByUserId) {
    const youthPmOut = day?.punches?.pm_out?.youthTimeIso;
    if (youthPmOut && sameIsoMoment(out, youthPmOut)) return false;
    return true;
  }
  return false;
}

export function staffAfternoonOutInput(
  daily: StaffCorrectionDaily | null | undefined,
  day?: Pick<StudentDayAttendance, "punches">,
): string {
  if (!hasStaffAfternoonOutCorrection(daily, day)) return "";
  const out = daily?.signOutTime || daily?.adjustedSignOut;
  if (isScheduleAutofillTime(out) || isScheduledPlaceholderTime(out)) return "";
  return toTimeInputValue(out);
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
  if (slot.youthTimeIso && isScheduleAutofillTime(slot.youthTimeIso)) {
    return "—";
  }
  if (punch === "pm_out" && isDefaultAfternoonOutTime(slot.youthTimeIso)) {
    return "—";
  }
  const candidates = [
    slot.youthTimeIso ? formatAttendanceTime(slot.youthTimeIso) : null,
    slot.timeLabel,
    slot.adjustedTimeLabel,
    slot.originalTimeLabel,
  ];
  for (const label of candidates) {
    if (label && label !== "[object Object]" && !isScheduleAutofillTime(label)) {
      if (punch === "pm_out" && isDefaultAfternoonOutTime(label)) continue;
      return label;
    }
  }
  return "—";
}
