"use client";

import { useMemo } from "react";
import type { BobStudent } from "@/platform/api/bob/students";
import { isProgramDay } from "@/lib/bobProgramCalendar";
import { formatDayHoursPresent } from "../model/dayHours";
import type { StudentDayAttendance } from "../types";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { SessionSummary } from "./SessionSummary";

function formatDayHeading(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function StudentMyAttendanceCards({
  days,
  student,
  focusDate,
}: {
  days: StudentDayAttendance[];
  student?: BobStudent | null;
  focusDate: string;
}) {
  const programDays = useMemo(() => {
    const byDate = new Map<string, StudentDayAttendance>();
    for (const day of days) {
      if (!isProgramDay(day.date)) continue;
      byDate.set(day.date, day);
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, day]) => day);
  }, [days]);

  const stats = student?.attendanceStats;

  if (!programDays.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No attendance recorded yet for this period.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              My attendance
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-950 tabular-nums">
              {stats.hoursPct ?? 0}%
            </p>
            {stats.hoursAttended != null && stats.hoursPotential != null ? (
              <p className="text-xs text-emerald-900/80 mt-0.5">
                {stats.hoursAttended}h of {stats.hoursPotential}h
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              This week
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
              {stats.hoursPctThisWeek ?? 0}%
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Hours vs expected days</p>
          </div>
        </div>
      ) : null}

      <ul className="space-y-3">
        {programDays.map((day) => {
          const hoursLabel = formatDayHoursPresent(day);
          const isFocus = day.date === focusDate;
          return (
            <li
              key={day.key}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                isFocus ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDayHeading(day.date)}
                  </p>
                  <p className="text-xs text-gray-500">{day.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <AttendanceStatusBadge
                    attendanceState={
                      (day.dailyStatus as StudentDayAttendance["attendanceState"]) ||
                      day.attendanceState
                    }
                    health={day.health}
                  />
                  {hoursLabel !== "—" ? (
                    <p className="text-sm font-bold text-gray-900 tabular-nums mt-1">
                      {hoursLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              <SessionSummary day={day} />

              {day.missingPunchCount > 0 ? (
                <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {day.missingPunchCount} punch
                  {day.missingPunchCount === 1 ? "" : "es"} missing — use Submit →
                  Report absence / fix times if something looks wrong.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
