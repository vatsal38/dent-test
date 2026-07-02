"use client";

import type { FinalAttendanceRecord } from "../types";

function SessionTimes({
  title,
  session,
  compact,
}: {
  title: string;
  session: FinalAttendanceRecord["morning"];
  compact?: boolean;
}) {
  const inLabel = session.in && session.in !== "—" ? session.in : "—";
  const outLabel = session.out && session.out !== "—" ? session.out : "—";
  const hasTimes = inLabel !== "—" || outLabel !== "—";

  if (compact) {
    return (
      <div className="min-w-[120px]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 mb-1">
          {title}
        </p>
        {hasTimes ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-800">
            <span>{inLabel}</span>
            <span className="text-gray-300">→</span>
            <span>{outLabel}</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">—</p>
        )}
        {session.hours ? (
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
            {session.hours}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
      <h4 className="text-sm font-semibold text-emerald-900">{title}</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-emerald-700">
            Sign in
          </p>
          <p className="font-medium text-gray-900 tabular-nums">{inLabel}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-emerald-700">
            Sign out
          </p>
          <p className="font-medium text-gray-900 tabular-nums">{outLabel}</p>
        </div>
      </div>
      {session.hours ? (
        <p className="text-xs text-emerald-800 font-medium">{session.hours}</p>
      ) : null}
    </div>
  );
}

export function FinalAttendanceSummary({
  record,
  compact = false,
}: {
  record: FinalAttendanceRecord;
  compact?: boolean;
}) {
  const hasAny =
    record.morning.in ||
    record.morning.out ||
    record.afternoon.in ||
    record.afternoon.out ||
    record.totalHours;

  if (!hasAny) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-4">
          <SessionTimes title="Morning" session={record.morning} compact />
          <SessionTimes title="Afternoon" session={record.afternoon} compact />
        </div>
        {record.totalHours ? (
          <p className="text-[10px] font-semibold text-emerald-800">
            {record.totalHours} total
          </p>
        ) : null}
        {record.correctedByName ? (
          <p className="text-[10px] text-gray-500">
            Updated by {record.correctedByName}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SessionTimes title="Morning session" session={record.morning} />
      <SessionTimes title="Afternoon session" session={record.afternoon} />
      {record.totalHours ? (
        <p className="text-xs font-semibold text-emerald-900">
          {record.totalHours} total
        </p>
      ) : null}
      {record.correctedByName ? (
        <p className="text-xs text-gray-500">Updated by {record.correctedByName}</p>
      ) : null}
    </div>
  );
}
