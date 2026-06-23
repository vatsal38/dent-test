"use client";

import type { PodAttendanceStats } from "../types";

function MetricBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 gap-2">
        <span className="font-medium text-gray-700 truncate">{label}</span>
        <span className="text-gray-500 tabular-nums shrink-0">
          {value}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PodCard({ pod }: { pod: PodAttendanceStats }) {
  const attendancePct =
    pod.expected > 0 ? Math.round((pod.complete / pod.expected) * 100) : 0;
  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 truncate">{pod.podName}</p>
        <span className="text-xs font-medium text-emerald-700">{attendancePct}%</span>
      </div>
      <MetricBar label="Present" value={pod.complete} total={pod.expected} tone="bg-emerald-500" />
      <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600">
        <span>Late {pod.late}</span>
        <span>Missing {pod.missingPunches}</span>
        <span>Excused {pod.excused}</span>
        <span>Absent {pod.absent}</span>
        <span>Auto {pod.autoFilled}</span>
        <span>Avg {pod.averageHours || 0}h</span>
      </div>
    </div>
  );
}

export function PodSiteAnalytics({ podStats }: { podStats: PodAttendanceStats[] }) {
  const activePods = podStats.filter((p) => p.expected > 0);

  if (!activePods.length) {
    return (
      <p className="text-sm text-gray-500">No pod attendance data for this date.</p>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {activePods.map((p) => (
          <PodCard key={p.podId} pod={p} />
        ))}
      </div>
    </div>
  );
}
