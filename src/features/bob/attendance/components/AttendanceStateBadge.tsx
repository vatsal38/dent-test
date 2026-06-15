"use client";

import type { AttendanceState } from "../types";
import { ATTENDANCE_STATE_LABELS, ATTENDANCE_STATE_STYLES } from "../model/constants";

export function AttendanceStateBadge({
  state,
  className = "",
}: {
  state: AttendanceState;
  className?: string;
}) {
  const style = ATTENDANCE_STATE_STYLES[state] ?? ATTENDANCE_STATE_STYLES.missing_punch;
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${style.badge} ${className}`}
    >
      {ATTENDANCE_STATE_LABELS[state]}
    </span>
  );
}

/** @deprecated Use AttendanceStateBadge with attendanceState */
export function AttendanceStatusBadge({
  health,
  attendanceState,
}: {
  health?: string;
  attendanceState?: AttendanceState;
}) {
  if (attendanceState) {
    return <AttendanceStateBadge state={attendanceState} />;
  }
  if (health === "future") {
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-sky-50 text-sky-700">
        Future
      </span>
    );
  }
  const map: Record<string, AttendanceState> = {
    complete: "present",
    partial: "missing_punch",
    missing: "missing_punch",
    late: "late",
    excused: "excused",
    absent: "absent",
    auto_filled: "auto_filled",
  };
  return (
    <AttendanceStateBadge state={map[health || "missing"] ?? "missing_punch"} />
  );
}
