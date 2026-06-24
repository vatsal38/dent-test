import { BOB_POD_PLURAL, BOB_POD_SINGULAR } from "@/lib/bobDisplayTerminology";

import { useMemo } from "react";
import type { AttendanceWorkspaceData, StudentDayAttendance } from "../types";
import { DAY_NAMES } from "../weekDates";
import { resolvePodName, resolveStudentName } from "../model/resolveDisplay";
import { initialsOf } from "@/features/bob/roster/recordDisplay";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { SessionSummary } from "./SessionSummary";
import { ATTENDANCE_PAGE_SIZE } from "../model/scale";
import { studentMatchesSearch } from "../model/filterRows";
import {
  formatDayHoursPresent,
  formatHoursTotal,
  sumDayHours,
} from "../model/dayHours";
import { resolveAttendanceStaffNote } from "../model/attendanceStaffNotes";

export function DailyAttendanceTable({
  days,
  workspace,
  focusDate,
  weekDates,
  onSelectDay,
  selectedKeys,
  onToggleSelect,
  showCheckbox = false,
  search = "",
  page = 1,
  pageSize = ATTENDANCE_PAGE_SIZE,
}: {
  days: StudentDayAttendance[];
  workspace: AttendanceWorkspaceData;
  focusDate: string;
  weekDates?: string[];
  onSelectDay: (day: StudentDayAttendance) => void;
  selectedKeys?: Set<string>;
  onToggleSelect?: (key: string) => void;
  showCheckbox?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const isWeek = weekDates && weekDates.length > 1;

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
        const today = row.byDate.get(focusDate);
        return studentMatchesSearch(
          row.studentId,
          workspace.studentById,
          workspace.podById,
          today,
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

  if (!rowsByStudent.length) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm bg-white border border-gray-200 rounded-lg">
        {search.trim()
          ? "No students match your search."
          : `No students in scope. Select a ${BOB_POD_SINGULAR.toLowerCase()} or assign students from the ${BOB_POD_PLURAL} page.`}
      </div>
    );
  }

  const columns = isWeek ? weekDates! : [focusDate];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {showCheckbox ? (
              <th className="w-10 px-3 py-3" aria-label="Select" />
            ) : null}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
              Student
            </th>
            {!isWeek ? (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Hours today
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Program hrs
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[280px]">
                  Sessions
                </th>
              </>
            ) : null}
            {isWeek
              ? columns.map((d) => {
              const missing = days.filter(
                (x) =>
                  x.date === d &&
                  (x.health === "missing" || x.health === "partial"),
              ).length;
              const m = Number(d.slice(5, 7));
              const dayNum = Number(d.slice(8, 10));
              const dayName = DAY_NAMES[new Date(d + "T12:00:00").getDay()];
              return (
                <th
                  key={d}
                  className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                >
                  {dayName} {m}/{dayNum}
                  {missing > 0 ? (
                    <span className="block text-red-600 font-normal normal-case text-[10px]">
                      {missing} gap{missing === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </th>
              );
            })
              : null}
            {isWeek ? (
              <>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Week hrs
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap pr-4">
                  Program hrs
                </th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pagedRows.map((row) => {
            const name = resolveStudentName(
              row.studentId,
              workspace.studentById,
            );
            const podName = resolvePodName(row.podId, workspace.podById);
            const today = row.byDate.get(focusDate);
            const student = workspace.studentById.get(row.studentId);
            const programHours = student?.attendanceStats?.hoursAttended;
            const weekDays = isWeek
              ? Array.from(row.byDate.values())
              : [];
            const weekHoursTotal = sumDayHours(weekDays);
            const staffNote = today ? resolveAttendanceStaffNote(today) : null;
            return (
              <tr
                key={`${row.podId}-${row.studentId}`}
                className="hover:bg-orange-50/40"
              >
                {showCheckbox ? (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedKeys?.has(`${row.podId}|${row.studentId}`) ??
                        false
                      }
                      onChange={() =>
                        onToggleSelect?.(`${row.podId}|${row.studentId}`)
                      }
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                ) : null}
                <td className="px-4 py-2 sticky left-0 bg-white z-1">
                  <button
                    type="button"
                    onClick={() => today && onSelectDay(today)}
                    className="flex items-center gap-2 text-left w-full group"
                  >
                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-orange-200">
                      {initialsOf(name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {podName}
                      </p>
                      {staffNote ? (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5 italic">
                          {staffNote}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </td>
                {!isWeek && today ? (
                  <>
                    <td className="px-4 py-2">
                      <AttendanceStatusBadge
                        health={today.health}
                        attendanceState={today.attendanceState}
                      />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm font-medium text-gray-900">
                      {formatDayHoursPresent(today)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-gray-700">
                      {programHours != null ? `${programHours}h` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => onSelectDay(today)}
                        className="text-left w-full"
                      >
                        <SessionSummary day={today} compact />
                      </button>
                    </td>
                  </>
                ) : null}
                {isWeek
                  ? columns.map((d) => {
                  const cell = row.byDate.get(d);
                  if (!cell) {
                    return (
                      <td
                        key={d}
                        className="px-2 py-2 text-center text-gray-300 text-xs"
                      >
                        —
                      </td>
                    );
                  }
                  return (
                    <td
                      key={d}
                      className="px-2 py-2 text-center cursor-pointer align-top"
                      onClick={() => onSelectDay(cell)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <AttendanceStatusBadge attendanceState={cell.attendanceState} />
                        <span className="text-xs font-medium text-gray-700 tabular-nums">
                          {formatDayHoursPresent(cell)}
                        </span>
                      </div>
                    </td>
                  );
                })
                  : null}
                {isWeek ? (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums text-sm font-medium text-gray-900">
                      {formatHoursTotal(weekHoursTotal)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-gray-700 pr-4">
                      {programHours != null ? `${programHours}h` : "—"}
                    </td>
                  </>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
