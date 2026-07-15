import type { BobAttendance } from "@/platform/api/bob/attendance";
import type { AttendanceState } from "../types";

/** Map Airtable-computed attendance text to UI state — no hour math in React. */
export function mapAttendanceStateFromRecord(
  record?: Pick<
    BobAttendance,
    | "attendanceStatus"
    | "attendanceStatusHours"
    | "status"
    | "excusedAbsence"
    | "manualOverride"
    | "staffCorrectionSignIn"
    | "staffCorrectionSignOut"
  > | null,
): AttendanceState {
  if (!record) return "missing_punch";

  const statusField = String(record.attendanceStatus || "").toLowerCase();
  const statusHours = String(record.attendanceStatusHours || "").toLowerCase();
  const combined = `${statusField} ${statusHours}`.trim();

  if (record.excusedAbsence || combined.includes("excused")) return "excused";
  if (statusField === "absent" || combined.includes(" absent")) return "absent";
  if (combined.includes("auto fill") || combined.includes("auto-fill"))
    return "auto_filled";
  if (combined.includes("late")) return "late";
  if (
    combined.includes("missing punch") ||
    statusField.includes("signed out only") ||
    combined.includes("missing")
  ) {
    return "missing_punch";
  }
  if (statusField === "present" || combined.includes("present")) return "present";

  if (record.status === "excused") return "excused";
  if (record.status === "absent") return "absent";
  if (record.status === "late") return "late";
  if (record.status === "present") return "present";

  // Manual override alone is not presence — require punches / hours elsewhere
  return "missing_punch";
}

export function sessionStatusLabel(
  state: AttendanceState,
  missingSlots: string[],
): string {
  if (missingSlots.length > 0) {
    return `Missing ${missingSlots.join(", ")}`;
  }
  switch (state) {
    case "present":
      return "Complete";
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
