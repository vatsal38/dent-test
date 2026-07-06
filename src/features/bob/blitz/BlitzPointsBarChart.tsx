"use client";

import { pillTone } from "./BlitzLeaderboardTable";

export function BlitzPointsBarChart({
  teams,
  metric = "overall",
}: {
  teams: Array<{ name: string; points?: number; pointsThisWeek?: number }>;
  metric?: "overall" | "week";
}) {
  const rows = teams
    .map((t) => ({
      name: t.name,
      value: metric === "week" ? (t.pointsThisWeek ?? 0) : (t.points ?? 0),
    }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value);

  if (!rows.length) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No points logged yet for this view.
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold truncate max-w-[200px] ${pillTone(row.name)}`}
              >
                {row.name}
              </span>
              <span className="text-xs font-bold text-gray-900 tabular-nums shrink-0">
                {row.value}
              </span>
            </div>
            <div className="h-3 rounded-full bg-amber-100/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
