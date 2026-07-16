"use client";

import { useMemo, useState } from "react";
import type { AttendanceWorkspaceData, StudentDayAttendance } from "../types";
import {
  DAY_NAMES,
  getCalendarMonthBounds,
  shiftFocusMonth,
} from "../weekDates";
import { resolvePodName, resolveStudentName } from "../model/resolveDisplay";
import { initialsOf } from "@/features/bob/roster/recordDisplay";
import { ATTENDANCE_PAGE_SIZE } from "../model/scale";
import { studentMatchesSearch } from "../model/filterRows";
import {
  formatDayHoursPresent,
  formatHoursTotal,
  resolveDayHoursNumeric,
  sumDayHours,
} from "../model/dayHours";
import {
  PROGRAM_END_DATE,
  PROGRAM_START_DATE,
  listProgramDates,
} from "@/lib/bobProgramCalendar";
import { BOB_POD_PLURAL, BOB_POD_SINGULAR } from "@/lib/bobDisplayTerminology";

type Density = "compact" | "detailed";

function cellMeta(day: StudentDayAttendance | undefined): {
  letter: string;
  label: string;
  className: string;
} {
  if (!day) {
    return {
      letter: "·",
      label: "No record",
      className: "bg-gray-50 text-gray-300 border-gray-100",
    };
  }
  if (day.health === "future") {
    return {
      letter: "·",
      label: "Future",
      className: "bg-sky-50 text-sky-400 border-sky-100",
    };
  }
  const state = day.attendanceState;
  if (state === "present" || day.health === "complete") {
    return {
      letter: "P",
      label: `Present · ${formatDayHoursPresent(day)}`,
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }
  if (state === "late" || day.health === "late" || day.isLate) {
    return {
      letter: "L",
      label: `Late · ${formatDayHoursPresent(day)}`,
      className: "bg-amber-100 text-amber-900 border-amber-200",
    };
  }
  if (state === "excused" || day.health === "excused") {
    return {
      letter: "E",
      label: "Excused",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }
  if (state === "absent" || day.health === "absent") {
    return {
      letter: "A",
      label: "Absent",
      className: "bg-rose-100 text-rose-800 border-rose-200",
    };
  }
  if (state === "auto_filled" || day.health === "auto_filled") {
    return {
      letter: "F",
      label: `Auto filled · ${formatDayHoursPresent(day)}`,
      className: "bg-blue-100 text-blue-800 border-blue-200",
    };
  }
  return {
    letter: "G",
    label: `Gap · ${formatDayHoursPresent(day)}`,
    className: "bg-orange-100 text-orange-800 border-orange-200",
  };
}

const LEGEND: Array<{ letter: string; label: string; className: string }> = [
  {
    letter: "P",
    label: "Present",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    letter: "L",
    label: "Late",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    letter: "G",
    label: "Gap",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    letter: "A",
    label: "Absent",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  {
    letter: "E",
    label: "Excused",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  {
    letter: "F",
    label: "Auto filled",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
];

function DayCell({
  day,
  date,
  density,
  isFocus,
  onSelect,
}: {
  day: StudentDayAttendance | undefined;
  date: string;
  density: Density;
  isFocus: boolean;
  onSelect: (day: StudentDayAttendance) => void;
}) {
  const meta = cellMeta(day);
  const hours = day ? resolveDayHoursNumeric(day) : 0;
  const common = `rounded border transition-shadow ${meta.className} ${
    isFocus ? "ring-2 ring-orange-400 ring-offset-1" : ""
  } ${day ? "cursor-pointer hover:shadow-sm" : "cursor-default"}`;

  if (density === "detailed") {
    return (
      <button
        type="button"
        disabled={!day}
        title={`${date} · ${meta.label}`}
        onClick={() => day && onSelect(day)}
        className={`${common} w-full min-w-13 px-1 py-1.5 flex flex-col items-center gap-0.5`}
      >
        <span className="text-[11px] font-bold leading-none">{meta.letter}</span>
        <span className="text-[10px] tabular-nums leading-none opacity-80">
          {day && hours > 0 ? `${hours}h` : "—"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!day}
      title={`${date} · ${meta.label}`}
      onClick={() => day && onSelect(day)}
      className={`${common} w-7 h-7 sm:w-8 sm:h-8 text-[11px] font-bold flex items-center justify-center`}
    >
      {meta.letter}
    </button>
  );
}

export function MonthlyAttendanceView({
  days,
  workspace,
  focusDate,
  monthDates,
  onSelectDay,
  onFocusDateChange,
  search = "",
  page = 1,
  pageSize = ATTENDANCE_PAGE_SIZE,
  onPageChange,
}: {
  days: StudentDayAttendance[];
  workspace: AttendanceWorkspaceData;
  focusDate: string;
  monthDates: string[];
  onSelectDay: (day: StudentDayAttendance) => void;
  onFocusDateChange?: (date: string) => void;
  search?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}) {
  const [density, setDensity] = useState<Density>("compact");
  const month = getCalendarMonthBounds(focusDate);

  const rowsByStudent = useMemo(() => {
    const map = new Map<
      string,
      {
        podId: string;
        studentId: string;
        byDate: Map<string, StudentDayAttendance>;
      }
    >();
    for (const d of days) {
      const rk = `${d.podId}|${d.studentId}`;
      if (!map.has(rk)) {
        map.set(rk, {
          podId: d.podId,
          studentId: d.studentId,
          byDate: new Map(),
        });
      }
      map.get(rk)!.byDate.set(d.date, d);
    }
    return Array.from(map.values())
      .filter((row) => {
        const focus = row.byDate.get(focusDate);
        return studentMatchesSearch(
          row.studentId,
          workspace.studentById,
          workspace.podById,
          focus,
          search,
        );
      })
      .sort((a, b) =>
        resolveStudentName(a.studentId, workspace.studentById).localeCompare(
          resolveStudentName(b.studentId, workspace.studentById),
        ),
      );
  }, [days, workspace.studentById, workspace.podById, search, focusDate]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rowsByStudent.slice(start, start + pageSize);
  }, [rowsByStudent, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(rowsByStudent.length / pageSize));

  const prevMonth = shiftFocusMonth(focusDate, -1);
  const nextMonth = shiftFocusMonth(focusDate, 1);
  const canPrev = getCalendarMonthBounds(prevMonth).endDate >= PROGRAM_START_DATE;
  const canNext = getCalendarMonthBounds(nextMonth).startDate <= PROGRAM_END_DATE;

  const dayGapCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of monthDates) counts.set(d, 0);
    for (const day of days) {
      if (
        (day.health === "missing" ||
          day.health === "partial" ||
          day.attendanceState === "missing_punch") &&
        counts.has(day.date)
      ) {
        counts.set(day.date, (counts.get(day.date) || 0) + 1);
      }
    }
    return counts;
  }, [days, monthDates]);

  const pagination =
    onPageChange && rowsByStudent.length > pageSize ? (
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-500 tabular-nums">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-3">
          {page > 1 ? (
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              className="text-sm font-medium text-orange-700 hover:underline"
            >
              ← Back
            </button>
          ) : null}
          {page < totalPages ? (
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              className="text-sm font-medium text-orange-700 hover:underline"
            >
              Next page →
            </button>
          ) : (
            <span className="text-xs text-gray-400">End of roster</span>
          )}
        </div>
      </div>
    ) : null;

  if (!monthDates.length) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm bg-white border border-gray-200 rounded-lg">
        No program days in {month.label}. Pick a date inside the BoB program
        window.
      </div>
    );
  }

  if (!rowsByStudent.length) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm bg-white border border-gray-200 rounded-lg">
        {search.trim()
          ? "No students match your search."
          : `No students in scope. Select a ${BOB_POD_SINGULAR.toLowerCase()} or assign students from the ${BOB_POD_PLURAL} page.`}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canPrev || !onFocusDateChange}
            onClick={() => {
              if (!onFocusDateChange || !canPrev) return;
              const bounds = getCalendarMonthBounds(prevMonth);
              const start =
                bounds.startDate < PROGRAM_START_DATE
                  ? PROGRAM_START_DATE
                  : bounds.startDate;
              const end =
                bounds.endDate > PROGRAM_END_DATE
                  ? PROGRAM_END_DATE
                  : bounds.endDate;
              const programDays = listProgramDates({
                startDate: start,
                endDate: end,
                throughDate: end,
              });
              onFocusDateChange(programDays[0] || start);
            }}
            className="h-8 w-8 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="min-w-36 text-center">
            <p className="text-sm font-semibold text-gray-900">{month.label}</p>
            <p className="text-[10px] text-gray-500 tabular-nums">
              {monthDates.length} program day
              {monthDates.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            disabled={!canNext || !onFocusDateChange}
            onClick={() => {
              if (!onFocusDateChange || !canNext) return;
              const bounds = getCalendarMonthBounds(nextMonth);
              const start =
                bounds.startDate < PROGRAM_START_DATE
                  ? PROGRAM_START_DATE
                  : bounds.startDate;
              const end =
                bounds.endDate > PROGRAM_END_DATE
                  ? PROGRAM_END_DATE
                  : bounds.endDate;
              const programDays = listProgramDates({
                startDate: start,
                endDate: end,
                throughDate: end,
              });
              onFocusDateChange(programDays[0] || start);
            }}
            className="h-8 w-8 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
          {(
            [
              { id: "compact", label: "Compact" },
              { id: "detailed", label: "Hours" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDensity(opt.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                density === opt.id
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {LEGEND.map((item) => (
            <span
              key={item.letter}
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${item.className}`}
            >
              <span className="font-bold">{item.letter}</span>
              <span className="hidden sm:inline font-normal opacity-80">
                {item.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Mobile: flexible wrap grid per student */}
      <div className="md:hidden divide-y divide-gray-100">
        {pagedRows.map((row) => {
          const name = resolveStudentName(row.studentId, workspace.studentById);
          const student = workspace.studentById.get(row.studentId);
          const podName = resolvePodName(
            row.podId,
            workspace.podById,
            student,
          );
          const monthHours = sumDayHours(
            monthDates
              .map((d) => row.byDate.get(d))
              .filter(Boolean) as StudentDayAttendance[],
          );
          return (
            <div key={`${row.podId}-${row.studentId}`} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {initialsOf(name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{podName}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-gray-900 shrink-0">
                  {formatHoursTotal(monthHours)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {monthDates.map((d) => {
                  const cell = row.byDate.get(d);
                  const dayNum = Number(d.slice(8, 10));
                  return (
                    <div key={d} className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-gray-400 tabular-nums">
                        {dayNum}
                      </span>
                      <DayCell
                        day={cell}
                        date={d}
                        density={density}
                        isFocus={d === focusDate}
                        onSelect={onSelectDay}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {pagination}
      </div>

      {/* Desktop: scrollable month matrix */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-20 bg-gray-50 px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-44">
                Student
              </th>
              {monthDates.map((d) => {
                const dayNum = Number(d.slice(8, 10));
                const dayName = DAY_NAMES[new Date(d + "T12:00:00").getDay()];
                const gaps = dayGapCounts.get(d) || 0;
                const isFocus = d === focusDate;
                return (
                  <th
                    key={d}
                    className={`px-1 py-2 text-center border-b border-gray-200 ${
                      isFocus ? "bg-orange-50" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onFocusDateChange?.(d)}
                      className="mx-auto block"
                      title={`Focus ${d}`}
                    >
                      <span className="block text-[10px] font-medium text-gray-500 uppercase">
                        {dayName.slice(0, 1)}
                      </span>
                      <span
                        className={`block text-xs font-semibold tabular-nums ${
                          isFocus ? "text-orange-700" : "text-gray-800"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {gaps > 0 ? (
                        <span className="block text-[9px] text-red-600 font-normal normal-case">
                          {gaps}
                        </span>
                      ) : (
                        <span className="block text-[9px] text-transparent">0</span>
                      )}
                    </button>
                  </th>
                );
              })}
              <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap sticky right-0 bg-gray-50 z-10">
                Month hrs
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const name = resolveStudentName(
                row.studentId,
                workspace.studentById,
              );
              const student = workspace.studentById.get(row.studentId);
              const podName = resolvePodName(
                row.podId,
                workspace.podById,
                student,
              );
              const monthHours = sumDayHours(
                monthDates
                  .map((d) => row.byDate.get(d))
                  .filter(Boolean) as StudentDayAttendance[],
              );
              const focusDay = row.byDate.get(focusDate);
              return (
                <tr
                  key={`${row.podId}-${row.studentId}`}
                  className="hover:bg-orange-50/30"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 border-b border-gray-50">
                    <button
                      type="button"
                      onClick={() => focusDay && onSelectDay(focusDay)}
                      className="flex items-center gap-2 text-left w-full group"
                    >
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {initialsOf(name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-800">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {podName}
                        </p>
                      </div>
                    </button>
                  </td>
                  {monthDates.map((d) => (
                    <td
                      key={d}
                      className={`px-1 py-1.5 text-center border-b border-gray-50 align-middle ${
                        d === focusDate ? "bg-orange-50/50" : ""
                      }`}
                    >
                      <div className="flex justify-center">
                        <DayCell
                          day={row.byDate.get(d)}
                          date={d}
                          density={density}
                          isFocus={d === focusDate}
                          onSelect={onSelectDay}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums text-sm font-semibold text-gray-900 border-b border-gray-50 sticky right-0 bg-white z-10">
                    {formatHoursTotal(monthHours)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pagination}
      </div>
    </div>
  );
}
