import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import type { AttendanceState, PunchType, PunchVisualState } from "../types";

export const PUNCH_LABELS: Record<PunchType, string> = {
  am_in: "AM In",
  am_out: "AM Out",
  pm_in: "PM In",
  pm_out: "PM Out",
};

export const PUNCH_SHORT: Record<PunchType, string> = {
  am_in: "AM In",
  am_out: "AM Out",
  pm_in: "PM In",
  pm_out: "PM Out",
};

export const STATUS_LABELS: Record<BobAttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
  late: "Late",
};

export const ATTENDANCE_STATE_LABELS: Record<AttendanceState, string> = {
  present: "Present",
  missing_punch: "Missing punch",
  late: "Late",
  absent: "Absent",
  excused: "Excused",
  auto_filled: "Auto filled",
};

export const ATTENDANCE_STATE_STYLES: Record<
  AttendanceState,
  { badge: string; dot: string }
> = {
  present: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  missing_punch: { badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
  late: { badge: "bg-amber-100 text-amber-900", dot: "bg-amber-400" },
  absent: { badge: "bg-red-100 text-red-800", dot: "bg-red-500" },
  excused: { badge: "bg-gray-100 text-gray-700", dot: "bg-slate-400" },
  auto_filled: { badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
};

export const PUNCH_STATE_COLORS: Record<
  PunchVisualState,
  { dot: string; ring: string; text: string }
> = {
  recorded: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
    text: "text-emerald-800",
  },
  late: {
    dot: "bg-amber-400",
    ring: "ring-amber-200",
    text: "text-amber-800",
  },
  missing: {
    dot: "bg-red-500",
    ring: "ring-red-200",
    text: "text-red-800",
  },
  excused: {
    dot: "bg-slate-300",
    ring: "ring-slate-200",
    text: "text-slate-600",
  },
  absent: {
    dot: "bg-rose-400",
    ring: "ring-rose-200",
    text: "text-rose-800",
  },
  auto_filled: {
    dot: "bg-blue-500",
    ring: "ring-blue-200",
    text: "text-blue-800",
  },
  na: {
    dot: "bg-gray-200",
    ring: "ring-gray-100",
    text: "text-gray-400",
  },
};

export const DAY_HEALTH_STYLES: Record<
  string,
  { badge: string; label: string }
> = {
  complete: { badge: "bg-emerald-100 text-emerald-800", label: "Complete" },
  partial: { badge: "bg-orange-100 text-orange-800", label: "Missing punch" },
  missing: { badge: "bg-red-100 text-red-800", label: "Missing" },
  late: { badge: "bg-amber-100 text-amber-900", label: "Late" },
  excused: { badge: "bg-gray-100 text-gray-700", label: "Excused" },
  absent: { badge: "bg-red-100 text-red-800", label: "Absent" },
  auto_filled: { badge: "bg-blue-100 text-blue-800", label: "Auto filled" },
  future: { badge: "bg-sky-50 text-sky-700", label: "Future" },
};
