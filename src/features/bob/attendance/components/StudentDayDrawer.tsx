"use client";

import Link from "next/link";
import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import {
  BOB_ATTENDANCE_STATUSES,
} from "@/platform/api/bob/attendance";
import type { AttendanceWorkspaceData, StudentDayAttendance } from "../types";
import { resolvePodName, resolveStudentName } from "../model/resolveDisplay";
import { STATUS_LABELS } from "../model/constants";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { AttendanceTimeline } from "./AttendanceTimeline";
import { useUpsertBobAttendanceDay } from "@/platform/query/hooks/useBobAttendance";

export function StudentDayDrawer({
  day,
  workspace,
  onClose,
}: {
  day: StudentDayAttendance;
  workspace: AttendanceWorkspaceData;
  onClose: () => void;
}) {
  const upsert = useUpsertBobAttendanceDay();
  const name = resolveStudentName(day.studentId, workspace.studentById);
  const podName = resolvePodName(day.podId, workspace.podById);
  const student = workspace.studentById.get(day.studentId);

  async function setStatus(status: BobAttendanceStatus) {
    await upsert.mutateAsync({
      studentId: day.studentId,
      podId: day.podId,
      date: day.date,
      status,
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/25 z-40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Attendance detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-base font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">
              {podName} · {day.date}
              {student?.track ? ` · ${student.track}` : ""}
            </p>
            <div className="mt-2">
              <AttendanceStatusBadge health={day.health} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h3>
            <AttendanceTimeline day={day} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Payroll-safe correction
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Sets the daily rollup status (syncs with existing attendance API).
            </p>
            <div className="flex flex-wrap gap-2">
              {BOB_ATTENDANCE_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={upsert.isPending}
                  onClick={() => setStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    day.dailyStatus === st
                      ? "border-orange-500 bg-orange-50 text-orange-800"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {STATUS_LABELS[st]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-4 flex gap-2">
          <Link
            href={`/app/bob/attendance/mark?pod=${day.podId}&date=${day.date}`}
            className="flex-1 text-center px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Open scan mode
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
