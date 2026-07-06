"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { BobStudent } from "@/platform/api/bob/students";
import { isProgramDay } from "@/lib/bobProgramCalendar";
import { formatDayHoursPresent } from "../model/dayHours";
import type { StudentDayAttendance } from "../types";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { AttendancePunchBlock, AttendancePunchRow } from "./AttendancePunchRows";

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

      <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-orange-950">
            Absence & sign-in/out correction
          </p>
          <p className="text-xs text-orange-900/90 mt-0.5">
            Report a planned absence or fix punch times for a day you attended.
          </p>
        </div>
        <Link
          href="/app/bob/attendance/correction"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Open form
        </Link>
      </div>

      <ul className="space-y-3">
        {programDays.map((day) => {
          const hoursLabel = formatDayHoursPresent(day);
          const isFocus = day.date === focusDate;
          const final = day.finalRecord;
          const hasYouthSignIn =
            day.morning.in.timeLabel ||
            day.morning.out.timeLabel ||
            day.afternoon.in.timeLabel ||
            day.afternoon.out.timeLabel;

          return (
            <li
              key={day.key}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                isFocus ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900 leading-tight">
                    {formatDayHeading(day.date)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{day.date}</p>
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
                    <p className="text-lg font-bold text-gray-900 tabular-nums mt-1">
                      {hoursLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              <AttendancePunchBlock title="Sign-in & sign-out">
                <AttendancePunchRow
                  label="AM"
                  inTime={final.morning.in}
                  outTime={final.morning.out}
                  hours={final.morning.hours}
                  size="large"
                />
                <AttendancePunchRow
                  label="PM"
                  inTime={final.afternoon.in}
                  outTime={final.afternoon.out}
                  hours={final.afternoon.hours}
                  size="large"
                />
                {final.totalHours ? (
                  <p className="text-xs font-semibold text-emerald-900 text-right tabular-nums pt-1 border-t border-emerald-100">
                    {final.totalHours} total
                  </p>
                ) : null}
              </AttendancePunchBlock>

              {hasYouthSignIn ? (
                <details className="mt-2 group">
                  <summary className="text-[11px] font-medium text-gray-500 cursor-pointer list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">›</span>
                    What I tapped at sign-in
                  </summary>
                  <div className="mt-2">
                    <AttendancePunchBlock title="Youth sign-in" tone="gray">
                      <AttendancePunchRow
                        label="AM"
                        inTime={day.morning.in.timeLabel}
                        outTime={day.morning.out.timeLabel}
                        hours={day.morning.hoursLabel}
                        tone="gray"
                        size="large"
                      />
                      <AttendancePunchRow
                        label="PM"
                        inTime={day.afternoon.in.timeLabel}
                        outTime={day.afternoon.out.timeLabel}
                        hours={day.afternoon.hoursLabel}
                        tone="gray"
                        size="large"
                      />
                    </AttendancePunchBlock>
                  </div>
                </details>
              ) : null}

              {day.missingPunchCount > 0 ? (
                <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {day.missingPunchCount} punch
                  {day.missingPunchCount === 1 ? "" : "es"} missing —{" "}
                  <Link
                    href={`/app/bob/attendance/correction?date=${encodeURIComponent(day.date)}&type=time_correction`}
                    className="font-semibold underline"
                  >
                    report absence or fix times
                  </Link>
                  .
                </p>
              ) : (
                <p className="mt-3 text-xs text-gray-600">
                  <Link
                    href={`/app/bob/attendance/correction?date=${encodeURIComponent(day.date)}`}
                    className="font-medium text-orange-600 hover:underline"
                  >
                    Report absence or correct times for this day
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
