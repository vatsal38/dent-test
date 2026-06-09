import type { PunchType } from "../types";
import { PUNCH_TYPES } from "../types";

/** Map Airtable / free-text sign types to canonical session punch slots. */
export function normalizeSignType(raw: string | null | undefined): PunchType | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/\s+/g, " ");

  if ((s.includes("am") || s.includes("morning")) && s.includes("in")) return "am_in";
  if (
    (s.includes("am") || s.includes("morning") || s.includes("lunch")) &&
    s.includes("out")
  ) {
    return "am_out";
  }
  if (
    (s.includes("pm") || s.includes("afternoon") || s.includes("lunch")) &&
    s.includes("in")
  ) {
    return "pm_in";
  }
  if ((s.includes("pm") || s.includes("afternoon") || s.includes("end")) && s.includes("out")) {
    return "pm_out";
  }

  if (s === "am in" || s === "am sign-in" || s === "am sign in") return "am_in";
  if (s === "am out" || s === "lunch out") return "am_out";
  if (s === "pm in" || s === "lunch in") return "pm_in";
  if (s === "pm out" || s === "pm sign-out" || s === "pm sign out") return "pm_out";

  for (const pt of PUNCH_TYPES) {
    if (s.includes(pt.replace("_", " "))) return pt;
  }
  return null;
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
