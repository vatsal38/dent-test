"use client";

import type { PodAttendanceStats } from "../types";
import { siteRollup } from "../model/computeWorkspace";

function Bar({
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
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700 truncate pr-2">{label}</span>
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

export function PodSiteAnalytics({ podStats }: { podStats: PodAttendanceStats[] }) {
  const sites = siteRollup(podStats);
  const activePods = podStats.filter((p) => p.expected > 0);

  if (!activePods.length && !sites.length) {
    return (
      <p className="text-sm text-gray-500">No pod attendance data for this date.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Pod attendance</h3>
        {activePods.map((p) => (
          <Bar
            key={p.podId}
            label={p.podName}
            value={p.complete}
            total={p.expected}
            tone="bg-emerald-500"
          />
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Site rollup</h3>
        {sites.map((s) => (
          <Bar
            key={s.siteName}
            label={s.siteName}
            value={s.complete}
            total={s.expected}
            tone="bg-orange-500"
          />
        ))}
      </div>
    </div>
  );
}
