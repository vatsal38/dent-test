"use client";

import Link from "next/link";
import type { AttendanceWorkspaceData, StudentDayAttendance } from "../types";
import { resolvePodName, resolveStudentName } from "../model/resolveDisplay";
import { AttendanceStateBadge } from "./AttendanceStateBadge";
import { StaffAttendanceRecordEditor } from "./StaffAttendanceRecordEditor";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

export function StudentDayDrawer({
  day,
  workspace,
  onClose,
  onSaved,
}: {
  day: StudentDayAttendance;
  workspace: AttendanceWorkspaceData;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { can } = useBobAccess();
  const canEdit = can("attendance.mark");
  const name = resolveStudentName(day.studentId, workspace.studentById);
  const podName = resolvePodName(day.podId, workspace.podById);

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} aria-hidden />
      <aside className="fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {canEdit ? "Edit attendance" : "Attendance detail"}
          </h2>
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
              {day.track ? ` · ${day.track}` : ""}
            </p>
            <div className="mt-2">
              <AttendanceStateBadge state={day.attendanceState} />
            </div>
          </div>

          {canEdit ? (
            <StaffAttendanceRecordEditor
              day={day}
              onSaved={onSaved}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Staff with mark attendance permission can edit this record. Youth
              submit correction requests through the One Stop form; staff review
              them in{" "}
              <Link
                href="/app/bob/attendance/discrepancies"
                className="text-orange-600 hover:underline font-medium"
              >
                attendance corrections
              </Link>
              .
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 flex flex-wrap gap-2">
          <Link
            href={`/app/bob/attendance/discrepancies?date=${day.date}`}
            className="flex-1 min-w-[140px] text-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Attendance corrections
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
