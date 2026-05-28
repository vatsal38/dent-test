import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import type { PunchType, PunchVisualState } from "../types";

export const PUNCH_LABELS: Record<PunchType, string> = {
  am_in: "AM In",
  lunch_out: "Lunch Out",
  lunch_in: "Lunch In",
  pm_out: "PM Out",
};

export const PUNCH_SHORT: Record<PunchType, string> = {
  am_in: "AM",
  lunch_out: "LO",
  lunch_in: "LI",
  pm_out: "PM",
};

export const STATUS_LABELS: Record<BobAttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
  late: "Late",
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
  partial: { badge: "bg-amber-100 text-amber-800", label: "Partial" },
  missing: { badge: "bg-red-100 text-red-800", label: "Missing" },
  late: { badge: "bg-amber-100 text-amber-900", label: "Late" },
  excused: { badge: "bg-slate-100 text-slate-700", label: "Excused" },
  absent: { badge: "bg-rose-100 text-rose-800", label: "Absent" },
};
