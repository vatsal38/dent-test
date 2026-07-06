"use client";

import type { AttendanceWorkspaceData, StudentDayAttendance } from "../types";
import { DAY_NAMES } from "../weekDates";
import { resolvePodName, resolveStudentName } from "../model/resolveDisplay";
import { initialsOf } from "@/features/bob/roster/recordDisplay";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { StaffCorrectionSummary } from "./StaffCorrectionSummary";
import { formatDayHoursPresent, formatHoursTotal, sumDayHours } from "../model/dayHours";
import { resolveAttendanceStaffNote } from "../model/attendanceStaffNotes";

import { AttendancePunchRow } from "./AttendancePunchRows";
function DailyStudentCard({
  name,
  podName,
  staffNote,
  today,
  programHours,
  onSelect,
}: {
  name: string;
  podName: string;
  staffNote: string | null;
  today: StudentDayAttendance;
  programHours?: number;
  onSelect: () => void;
}) {
  const hasStaffCorrection = today.staffCorrections.hasCorrections;
  const final = today.finalRecord;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-xl border border-gray-200 bg-white p-3 shadow-sm active:bg-orange-50/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-orange-500 text-white text-sm font-semibold flex items-center justify-center shrink-0">
          {initialsOf(name)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{name}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{podName}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base font-bold tabular-nums text-gray-900">
                {formatDayHoursPresent(today)}
              </p>
              <div className="mt-1 flex justify-end">
                <AttendanceStatusBadge
                  health={today.health}
                  attendanceState={today.attendanceState}
                />
              </div>
            </div>
          </div>
          {programHours != null ? (
            <p className="text-[10px] text-gray-500 mt-1 tabular-nums">
              Program total: {programHours}h
            </p>
          ) : null}
          {staffNote ? (
            <p className="text-[10px] text-gray-500 mt-1 italic line-clamp-2">{staffNote}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
          Final record
        </p>
        <AttendancePunchRow
          label="AM"
          inTime={final.morning.in}
          outTime={final.morning.out}
          hours={final.morning.hours}
        />
        <AttendancePunchRow
          label="PM"
          inTime={final.afternoon.in}
          outTime={final.afternoon.out}
          hours={final.afternoon.hours}
        />
        {final.totalHours ? (
          <p className="text-[10px] font-semibold text-emerald-800 text-right tabular-nums pt-0.5">
            {final.totalHours} total
          </p>
        ) : null}
      </div>

      {hasStaffCorrection ? (
        <div className="mt-2 rounded-lg border border-orange-100 bg-orange-50/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-800 mb-1">
            Staff corrections
          </p>
          <StaffCorrectionSummary corrections={today.staffCorrections} compact />
        </div>
      ) : null}

      <details className="mt-2 group">
        <summary className="text-[10px] font-medium text-gray-500 cursor-pointer list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform">›</span>
          Youth sign-in
        </summary>
        <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 space-y-1.5">
          <AttendancePunchRow
            label="AM"
            inTime={today.morning.in.timeLabel}
            outTime={today.morning.out.timeLabel}
            hours={today.morning.hoursLabel}
            tone="gray"
          />
          <AttendancePunchRow
            label="PM"
            inTime={today.afternoon.in.timeLabel}
            outTime={today.afternoon.out.timeLabel}
            hours={today.afternoon.hoursLabel}
            tone="gray"
          />
        </div>
      </details>
    </button>
  );
}

function WeekStudentCard({
  name,
  podName,
  focusDate,
  weekDates,
  byDate,
  weekHoursTotal,
  programHours,
  onSelectDay,
}: {
  name: string;
  podName: string;
  focusDate: string;
  weekDates: string[];
  byDate: Map<string, StudentDayAttendance>;
  weekHoursTotal: number;
  programHours?: number;
  onSelectDay: (day: StudentDayAttendance) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-10 h-10 rounded-full bg-orange-500 text-white text-sm font-semibold flex items-center justify-center shrink-0">
          {initialsOf(name)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{name}</p>
          <p className="text-xs text-gray-500 truncate">{podName}</p>
          <p className="text-xs font-medium text-gray-800 mt-1 tabular-nums">
            Week: {formatHoursTotal(weekHoursTotal)}
            {programHours != null ? ` · Program ${programHours}h` : ""}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(3.25rem,1fr))] gap-1.5">
        {weekDates.map((d) => {
          const cell = byDate.get(d);
          const dayName = DAY_NAMES[new Date(d + "T12:00:00").getDay()].slice(0, 3);
          const isFocus = d === focusDate;
          if (!cell) {
            return (
              <div
                key={d}
                className={`rounded-lg border px-1 py-2 text-center ${
                  isFocus ? "border-orange-200 bg-orange-50/30" : "border-gray-100 bg-gray-50"
                }`}
              >
                <p className="text-[10px] text-gray-400">{dayName}</p>
                <p className="text-xs text-gray-300 mt-1">—</p>
              </div>
            );
          }
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDay(cell)}
              className={`rounded-lg border px-1 py-2 text-center active:bg-orange-50 ${
                isFocus
                  ? "border-orange-300 bg-orange-50 ring-1 ring-orange-200"
                  : "border-gray-100 bg-white"
              }`}
            >
              <p className="text-[10px] font-medium text-gray-600">{dayName}</p>
              <div className="mt-1 flex justify-center scale-90">
                <AttendanceStatusBadge
                  health={cell.health}
                  attendanceState={
                    cell.health === "complete" ? "present" : cell.attendanceState
                  }
                />
              </div>
              <p className="text-[10px] font-semibold text-gray-800 tabular-nums mt-1">
                {formatDayHoursPresent(cell)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DailyAttendanceMobileCards({
  rows,
  workspace,
  focusDate,
  weekDates,
  isWeek,
  onSelectDay,
}: {
  rows: Array<{
    podId: string;
    studentId: string;
    byDate: Map<string, StudentDayAttendance>;
  }>;
  workspace: AttendanceWorkspaceData;
  focusDate: string;
  weekDates?: string[];
  isWeek: boolean;
  onSelectDay: (day: StudentDayAttendance) => void;
}) {
  return (
    <div className="md:hidden space-y-3">
      {rows.map((row) => {
        const student = workspace.studentById.get(row.studentId);
        const name = resolveStudentName(row.studentId, workspace.studentById);
        const podName = resolvePodName(row.podId, workspace.podById, student);
        const programHours = student?.attendanceStats?.hoursAttended;

        if (isWeek && weekDates?.length) {
          const weekDays = Array.from(row.byDate.values());
          return (
            <WeekStudentCard
              key={`${row.podId}-${row.studentId}`}
              name={name}
              podName={podName}
              focusDate={focusDate}
              weekDates={weekDates}
              byDate={row.byDate}
              weekHoursTotal={sumDayHours(weekDays)}
              programHours={programHours}
              onSelectDay={onSelectDay}
            />
          );
        }

        const today = row.byDate.get(focusDate);
        if (!today) return null;

        return (
          <DailyStudentCard
            key={`${row.podId}-${row.studentId}`}
            name={name}
            podName={podName}
            staffNote={resolveAttendanceStaffNote(today)}
            today={today}
            programHours={programHours}
            onSelect={() => onSelectDay(today)}
          />
        );
      })}
    </div>
  );
}
