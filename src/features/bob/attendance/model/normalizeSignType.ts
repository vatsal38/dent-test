import type { PunchType } from "../types";
import { PUNCH_TYPES } from "../types";

/** Map Airtable / free-text sign types to canonical punch slots. */
export function normalizeSignType(raw: string | null | undefined): PunchType | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/\s+/g, " ");

  if ((s.includes("am") || s.includes("morning")) && s.includes("in")) return "am_in";
  if (s.includes("lunch") && s.includes("out")) return "lunch_out";
  if (s.includes("lunch") && s.includes("in")) return "lunch_in";
  if ((s.includes("pm") || s.includes("afternoon") || s.includes("end")) && s.includes("out"))
    return "pm_out";

  if (s === "am in" || s === "am sign-in" || s === "am sign in") return "am_in";
  if (s === "lunch out") return "lunch_out";
  if (s === "lunch in") return "lunch_in";
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
}): boolean {
  if (record.signType) return true;
  if (record.airtableRecordId && !record.status) return true;
  return false;
}
