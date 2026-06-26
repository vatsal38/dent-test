import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";

/** Four session punch slots per student-day (morning + afternoon). */
export const PUNCH_TYPES = ["am_in", "am_out", "pm_in", "pm_out"] as const;
export type PunchType = (typeof PUNCH_TYPES)[number];

export const MORNING_PUNCHES: PunchType[] = ["am_in", "am_out"];
export const AFTERNOON_PUNCHES: PunchType[] = ["pm_in", "pm_out"];

/** Airtable-driven attendance states (display only — computed in Airtable). */
export type AttendanceState =
  | "present"
  | "missing_punch"
  | "late"
  | "absent"
  | "excused"
  | "auto_filled";

export type PunchVisualState =
  | "recorded"
  | "late"
  | "missing"
  | "excused"
  | "absent"
  | "auto_filled"
  | "na";

export interface PunchSlot {
  type: PunchType;
  state: PunchVisualState;
  /** Source punch event id when synced from Airtable */
  eventId?: string;
  timeLabel?: string;
  originalTimeLabel?: string;
  adjustedTimeLabel?: string;
  adjustmentReason?: string;
  adjustmentSource?: string;
  /** Raw ISO from youth punch event (never overwritten by daily rollup). */
  youthTimeIso?: string;
}

export interface AttendanceSession {
  in: PunchSlot;
  out: PunchSlot;
  /** Hours string from Airtable (AM Hours / PM Hours) — display only */
  hoursLabel?: string;
  statusLabel: string;
}

/** Staff-entered correction times (daily master record — not youth punch events). */
export interface StaffCorrectionSession {
  in?: string;
  out?: string;
}

export interface StaffCorrections {
  morning: StaffCorrectionSession;
  afternoon: StaffCorrectionSession;
  hasCorrections: boolean;
  /** Total hours from staff correction ISO fields */
  hoursLabel?: string;
}

export type DayHealth =
  | "complete"
  | "partial"
  | "missing"
  | "late"
  | "excused"
  | "absent"
  | "auto_filled"
  | "future";

export interface StudentDayAttendance {
  key: string;
  studentId: string;
  podId: string;
  date: string;
  punches: Record<PunchType, PunchSlot>;
  morning: AttendanceSession;
  afternoon: AttendanceSession;
  /** Primary Airtable attendance state */
  attendanceState: AttendanceState;
  dailyStatus?: BobAttendanceStatus;
  dailyRecordId?: string;
  airtableRecordId?: string;
  health: DayHealth;
  missingPunchCount: number;
  isLate: boolean;
  /** Airtable-computed totals — display only */
  totalHoursLabel?: string;
  expectedHoursLabel?: string;
  program?: string;
  site?: string;
  branch?: string;
  track?: string;
  manualOverride?: string;
  staffCorrectionSignIn?: string;
  staffCorrectionSignOut?: string;
  notes?: string;
  hasManualCorrection: boolean;
  hasAutoFill: boolean;
  /** Staff correction times from daily master (matches edit drawer). */
  staffCorrections: StaffCorrections;
}

export type IssueFilter =
  | "all"
  | "missing"
  | "late"
  | "complete"
  | "excused"
  | "absent"
  | "auto_filled"
  | "corrections"
  | "correction_requests"
  | "conflicts";

export type DiscrepancyKind =
  | "missing_punch"
  | "missing_day"
  | "late"
  | "correction_request"
  | "manual_override"
  | "auto_filled"
  | "conflict"
  | "unresolved_status";

export interface AttendanceDiscrepancy {
  id: string;
  kind: DiscrepancyKind;
  studentId: string;
  podId: string;
  date: string;
  punchType?: PunchType;
  label: string;
  status: "open" | "resolved";
}

export interface AttendanceAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body?: string;
  href?: string;
  count: number;
  issueFilter?: IssueFilter;
}

export interface PodAttendanceStats {
  podId: string;
  podName: string;
  siteName?: string;
  expected: number;
  complete: number;
  partial: number;
  missing: number;
  late: number;
  excused: number;
  absent: number;
  autoFilled: number;
  missingPunches: number;
  averageHours: number;
}

export interface AttendanceScaleMeta {
  enrollmentCount: number;
  requiresPodScope: boolean;
  recommendPodScope: boolean;
  weekViewHeavy: boolean;
  studentsLoaded: number;
  studentsRequested: number;
  attendanceRecordsLoaded: number;
  alertsTruncated: number;
}

export interface AttendanceIssueSummary {
  missingPunches: number;
  late: number;
  correctionRequests: number;
  manualOverrides: number;
  autoFilled: number;
  conflicts: number;
  total: number;
}

export interface AttendanceWorkspaceData {
  date: string;
  pods: BobPod[];
  students: BobStudent[];
  studentById: Map<string, BobStudent>;
  podById: Map<string, BobPod>;
  days: StudentDayAttendance[];
  discrepancies: AttendanceDiscrepancy[];
  alerts: AttendanceAlert[];
  podStats: PodAttendanceStats[];
  summary: {
    expected: number;
    complete: number;
    missingPunches: number;
    late: number;
    openDiscrepancies: number;
    excused: number;
    absent: number;
    autoFilled: number;
    present: number;
  };
  issues: AttendanceIssueSummary;
  scale: AttendanceScaleMeta;
}
