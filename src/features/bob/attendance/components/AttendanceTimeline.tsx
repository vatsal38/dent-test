"use client";

import type { StudentDayAttendance } from "../types";
import { PUNCH_TYPES } from "../types";
import { PUNCH_LABELS, PUNCH_STATE_COLORS } from "../model/constants";

export function AttendanceTimeline({ day }: { day: StudentDayAttendance }) {
  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-3">
      {PUNCH_TYPES.map((pt) => {
        const slot = day.punches[pt];
        const colors = PUNCH_STATE_COLORS[slot.state];
        return (
          <li key={pt} className="ml-4">
            <span
              className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ring-2 ring-white ${colors.dot}`}
            />
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-gray-800">{PUNCH_LABELS[pt]}</span>
              <span className={`text-xs capitalize ${colors.text}`}>
                {slot.timeLabel || slot.state}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
