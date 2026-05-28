"use client";

import type { AttendanceWorkspaceData } from "../types";

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "bad"
          ? "text-red-600"
          : "text-gray-900";
  return (
    <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg min-w-[120px] flex-1">
      <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

export function AttendanceHealthBar({
  summary,
  date,
}: {
  summary: AttendanceWorkspaceData["summary"];
  date: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs text-gray-500 mb-2">Health for {date}</p>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Stat label="Expected" value={summary.expected} />
        <Stat label="Complete" value={summary.complete} tone="good" />
        <Stat label="Missing punches" value={summary.missingPunches} tone="bad" />
        <Stat label="Late" value={summary.late} tone="warn" />
        <Stat label="Open issues" value={summary.openDiscrepancies} tone="warn" />
      </div>
    </div>
  );
}
