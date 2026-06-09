"use client";

import Link from "next/link";
import type { AttendanceWorkspaceData, StudentDayAttendance } from "../types";
import { resolvePodName, resolveStudentName } from "../model/resolveDisplay";
import { AttendanceStateBadge } from "./AttendanceStateBadge";
import { SessionSummary } from "./SessionSummary";
import { formatAttendanceTime } from "../model/formatAttendanceTime";
import { PUNCH_LABELS } from "../model/constants";

function AdjustmentRow({
  label,
  slot,
}: {
  label: string;
  slot: StudentDayAttendance["morning"]["in"];
}) {
  const hasAdjustment =
    slot.adjustedTimeLabel &&
    slot.originalTimeLabel &&
    slot.adjustedTimeLabel !== slot.originalTimeLabel;

  if (!slot.timeLabel && !hasAdjustment) return null;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-2">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-500">Original</p>
          <p className="font-medium text-gray-800">
            {slot.originalTimeLabel || slot.timeLabel || "Missing"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Adjusted</p>
          <p className="font-medium text-gray-800">
            {slot.adjustedTimeLabel || slot.timeLabel || "—"}
          </p>
        </div>
      </div>
      {slot.adjustmentReason ? (
        <p className="text-xs text-gray-600">
          Reason: {slot.adjustmentReason}
          {slot.adjustmentSource ? ` · Source: ${slot.adjustmentSource}` : ""}
        </p>
      ) : null}
    </div>
  );
}

export function StudentDayDrawer({
  day,
  workspace,
  onClose,
}: {
  day: StudentDayAttendance;
  workspace: AttendanceWorkspaceData;
  onClose: () => void;
}) {
  const name = resolveStudentName(day.studentId, workspace.studentById);
  const podName = resolvePodName(day.podId, workspace.podById);

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} aria-hidden />
      <aside className="fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl">
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

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
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

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendance summary</h3>
            <SessionSummary day={day} />
          </section>

          <section className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Daily total</p>
              <p className="font-semibold text-gray-900">{day.totalHoursLabel || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Expected hours</p>
              <p className="font-semibold text-gray-900">{day.expectedHoursLabel || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Program</p>
              <p className="font-medium text-gray-800 truncate">{day.program || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Site</p>
              <p className="font-medium text-gray-800">{day.site || day.branch || "—"}</p>
            </div>
          </section>

          {(day.staffCorrectionSignIn ||
            day.staffCorrectionSignOut ||
            day.manualOverride) && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Airtable adjustment record
              </h3>
              <div className="space-y-2 text-xs text-gray-700">
                {day.staffCorrectionSignIn ? (
                  <p>
                    Adjusted sign in:{" "}
                    <span className="font-medium">
                      {formatAttendanceTime(day.staffCorrectionSignIn)}
                    </span>
                  </p>
                ) : null}
                {day.staffCorrectionSignOut ? (
                  <p>
                    Adjusted sign out:{" "}
                    <span className="font-medium">
                      {formatAttendanceTime(day.staffCorrectionSignOut)}
                    </span>
                  </p>
                ) : null}
                {day.manualOverride ? (
                  <p>
                    Manual override:{" "}
                    <span className="font-medium">{day.manualOverride}</span>
                  </p>
                ) : null}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Punch adjustments</h3>
            <div className="space-y-2">
              <AdjustmentRow label={PUNCH_LABELS.am_in} slot={day.morning.in} />
              <AdjustmentRow label={PUNCH_LABELS.pm_out} slot={day.afternoon.out} />
            </div>
          </section>

          {day.notes ? (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Notes</h3>
              <p className="text-sm text-gray-600">{day.notes}</p>
            </section>
          ) : null}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 flex gap-2">
          <Link
            href={`/app/bob/attendance/mark?pod=${day.podId}&date=${day.date}`}
            className="flex-1 text-center px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Open issue triage
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
