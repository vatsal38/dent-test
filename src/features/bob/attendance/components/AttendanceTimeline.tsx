"use client";

import type { StudentDayAttendance } from "../types";
import { PUNCH_LABELS, PUNCH_STATE_COLORS } from "../model/constants";

export function AttendanceTimeline({ day }: { day: StudentDayAttendance }) {
  const entries = [
    { label: PUNCH_LABELS.am_in, slot: day.morning.in },
    { label: PUNCH_LABELS.am_out, slot: day.morning.out },
    { label: PUNCH_LABELS.pm_in, slot: day.afternoon.in },
    { label: PUNCH_LABELS.pm_out, slot: day.afternoon.out },
  ];

  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-3">
      {entries.map(({ label, slot }) => {
        const colors = PUNCH_STATE_COLORS[slot.state];
        return (
          <li key={label} className="ml-4">
            <span
              className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ring-2 ring-white ${colors.dot}`}
            />
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-gray-800">{label}</span>
              <span className={`text-xs capitalize ${colors.text}`}>
                {slot.timeLabel || slot.state}
              </span>
            </div>
            {slot.adjustedTimeLabel &&
            slot.originalTimeLabel &&
            slot.adjustedTimeLabel !== slot.originalTimeLabel ? (
              <p className="text-[11px] text-gray-500 mt-0.5">
                {slot.originalTimeLabel} → {slot.adjustedTimeLabel}
                {slot.adjustmentSource ? ` (${slot.adjustmentSource})` : ""}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
