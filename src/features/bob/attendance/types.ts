import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";

/** Four daily clock events per student (Airtable + ops model). */
export const PUNCH_TYPES = ["am_in", "lunch_out", "lunch_in", "pm_out"] as const;
export type PunchType = (typeof PUNCH_TYPES)[number];

export type PunchVisualState =
  | "recorded"
  | "late"
  | "missing"
  | "excused"
  | "absent"
  | "na";

export interface PunchSlot {
  type: PunchType;
  state: PunchVisualState;
  /** Source punch event id when synced from Airtable */
  eventId?: string;
  timeLabel?: string;
}

export type DayHealth =
  | "complete"
  | "partial"
  | "missing"
  | "late"
  | "excused"
  | "absent";

export interface StudentDayAttendance {
  key: string;
  studentId: string;
  podId: string;
  date: string;
  punches: Record<PunchType, PunchSlot>;
  dailyStatus?: BobAttendanceStatus;
  dailyRecordId?: string;
  health: DayHealth;
  missingPunchCount: number;
  isLate: boolean;
}

export type DiscrepancyKind =
  | "missing_punch"
  | "missing_day"
  | "late"
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
  };
  scale: AttendanceScaleMeta;
}
