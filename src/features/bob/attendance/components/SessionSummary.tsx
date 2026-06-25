"use client";

import type { AttendanceSession, StudentDayAttendance } from "../types";
import { PUNCH_LABELS, PUNCH_STATE_COLORS } from "../model/constants";

function SessionBlock({
  title,
  session,
  inLabel,
  outLabel,
  compact = false,
}: {
  title: string;
  session: AttendanceSession;
  inLabel: string;
  outLabel: string;
  compact?: boolean;
}) {
  const inColors = PUNCH_STATE_COLORS[session.in.state];
  const outColors = PUNCH_STATE_COLORS[session.out.state];

  if (compact) {
    return (
      <div className="min-w-[120px]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
          {title}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-800">
          <span className={`h-2 w-2 rounded-full ${inColors.dot}`} title="In" />
          <span>{session.in.timeLabel && session.in.timeLabel !== "[object Object]" ? session.in.timeLabel : "—"}</span>
          <span className="text-gray-300">→</span>
          <span className={`h-2 w-2 rounded-full ${outColors.dot}`} title="Out" />
          <span>{session.out.timeLabel && session.out.timeLabel !== "[object Object]" ? session.out.timeLabel : "—"}</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {session.hoursLabel ? `${session.hoursLabel} · ` : ""}
          {session.statusLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {session.hoursLabel ? (
          <span className="text-xs font-medium text-gray-600">{session.hoursLabel}</span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">{inLabel}</p>
          <p className={`font-medium ${inColors.text}`}>{session.in.timeLabel || "Missing"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">{outLabel}</p>
          <p className={`font-medium ${outColors.text}`}>{session.out.timeLabel || "Missing"}</p>
        </div>
      </div>
      <p className="text-xs text-gray-600">{session.statusLabel}</p>
    </div>
  );
}

export function SessionSummary({
  day,
  compact = false,
}: {
  day: Pick<StudentDayAttendance, "morning" | "afternoon">;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-4">
        <SessionBlock title="Morning" session={day.morning} inLabel={PUNCH_LABELS.am_in} outLabel={PUNCH_LABELS.am_out} compact />
        <SessionBlock title="Afternoon" session={day.afternoon} inLabel={PUNCH_LABELS.pm_in} outLabel={PUNCH_LABELS.pm_out} compact />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SessionBlock title="Morning session" session={day.morning} inLabel={PUNCH_LABELS.am_in} outLabel={PUNCH_LABELS.am_out} />
      <SessionBlock title="Afternoon session" session={day.afternoon} inLabel={PUNCH_LABELS.pm_in} outLabel={PUNCH_LABELS.pm_out} />
    </div>
  );
}

export function SessionLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
      <span>Morning: AM In → AM Out</span>
      <span>Afternoon: PM In → PM Out</span>
    </div>
  );
}
