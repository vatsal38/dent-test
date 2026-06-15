"use client";

import type { BobAttendance } from "@/platform/api/bob/attendance";
import { getWeekMonday } from "@/features/bob/attendance/weekDates";
import { isProgramDay } from "@/lib/bobProgramCalendar";

const BAR_STYLE: Record<string, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  excused: "bg-sky-500",
  absent: "bg-rose-500",
  future: "bg-gray-200",
  none: "bg-gray-100",
};

function weekProgramDays(anchor = new Date()): string[] {
  const monday = getWeekMonday(anchor);
  const start = new Date(`${monday}T12:00:00`);
  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (isProgramDay(iso)) days.push(iso);
  }
  return days;
}

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function statusForDate(
  iso: string,
  byDate: Map<string, BobAttendance>,
  today: string,
): string {
  if (iso > today) return "future";
  const row = byDate.get(iso);
  if (!row?.status) return "none";
  return row.status;
}

export function WeeklyAttendanceChart({
  rows,
}: {
  rows: BobAttendance[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const days = weekProgramDays();

  if (!days.length) {
    return (
      <p className="text-sm text-gray-500">No program days this week.</p>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        This week
      </h3>
      <div className="flex items-end gap-2 h-24">
        {days.map((iso) => {
          const status = statusForDate(iso, byDate, today);
          const height =
            status === "future"
              ? "20%"
              : status === "none"
                ? "12%"
                : status === "present"
                  ? "100%"
                  : status === "late"
                    ? "75%"
                    : status === "excused"
                      ? "50%"
                      : "30%";
          return (
            <div key={iso} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="w-full h-16 flex items-end justify-center">
                <div
                  className={`w-full max-w-[40px] rounded-t-md ${BAR_STYLE[status] || BAR_STYLE.none}`}
                  style={{ height }}
                  title={`${iso}: ${status}`}
                />
              </div>
              <span className="text-[10px] text-gray-500 truncate w-full text-center">
                {dayLabel(iso)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Present
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-amber-500" /> Late
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-rose-500" /> Absent
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-gray-200" /> Future
        </span>
      </div>
    </div>
  );
}
