import type { PunchType } from "../types";
import { PUNCH_TYPES } from "../types";

function isSignOutLabel(s: string): boolean {
  return (
    /\bout\b/.test(s) ||
    /sign[\s-]*out/.test(s) ||
    /leaving/.test(s) ||
    /1st sign-out/.test(s)
  );
}

function isSignInLabel(s: string): boolean {
  return (
    /\bin\b/.test(s) ||
    /sign[\s-]*in/.test(s) ||
    /arriv/.test(s) ||
    /back from lunch/.test(s)
  );
}

function isMorningBlock(s: string): boolean {
  return s.includes("morning") || /\bam\b/.test(s);
}

function isAfternoonBlock(s: string): boolean {
  return s.includes("afternoon") || /\bpm\b/.test(s) || s.includes("end of day");
}

/** Map Airtable / free-text sign types to canonical session punch slots. */
export function normalizeSignType(raw: string | null | undefined): PunchType | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/\s+/g, " ");

  if (isMorningBlock(s) && isSignOutLabel(s)) return "am_out";
  if (isMorningBlock(s) && isSignInLabel(s)) return "am_in";

  if (isAfternoonBlock(s) && isSignOutLabel(s)) return "pm_out";
  if (isAfternoonBlock(s) && isSignInLabel(s)) return "pm_in";

  if (s.includes("lunch") && isSignOutLabel(s)) return "am_out";
  if (s.includes("lunch") && isSignInLabel(s)) return "pm_in";

  if (s === "am in" || s === "am sign-in" || s === "am sign in") return "am_in";
  if (s === "am out" || s === "lunch out") return "am_out";
  if (s === "pm in" || s === "lunch in") return "pm_in";
  if (s === "pm out" || s === "pm sign-out" || s === "pm sign out") return "pm_out";

  if (isSignOutLabel(s) && /leaving|for day|end/.test(s)) return "pm_out";
  if (isSignInLabel(s) && /arriv|for day|1st/.test(s)) return "am_in";

  for (const pt of PUNCH_TYPES) {
    if (s.includes(pt.replace("_", " "))) return pt;
  }
  return null;
}

export function punchEventTimeIso(
  record: { signInTime?: string | null; signOutTime?: string | null },
  punchType: PunchType,
): string | undefined {
  const isOut = punchType.endsWith("_out");
  const iso = isOut
    ? record.signOutTime || record.signInTime
    : record.signInTime || record.signOutTime;
  return iso || undefined;
}

export function isPunchEventRecord(record: {
  signType?: string | null;
  status?: string | null;
  airtableRecordId?: string | null;
  attendanceStatusHours?: string | null;
  attendanceStatus?: string | null;
}): boolean {
  if (record.signType) return true;
  if (record.attendanceStatusHours || record.attendanceStatus) return false;
  if (record.airtableRecordId && !record.status) return true;
  return false;
}

export function isDailyAttendanceRecord(record: {
  signType?: string | null;
  attendanceStatusHours?: string | null;
  attendanceStatus?: string | null;
  hoursPresent?: string | null;
  signInTime?: string | null;
  signOutTime?: string | null;
}): boolean {
  if (record.signType) return false;
  return Boolean(
    record.attendanceStatusHours ||
      record.attendanceStatus ||
      record.hoursPresent ||
      record.signInTime ||
      record.signOutTime,
  );
}
