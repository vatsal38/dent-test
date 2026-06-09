"use client";

import { useMemo } from "react";
import type { PodAttendanceStats } from "../types";

export function AttendancePodQueue({
  podStats,
  focusDate,
  selectedPodId,
  onSelectPod,
}: {
  podStats: PodAttendanceStats[];
  focusDate: string;
  selectedPodId?: string;
  onSelectPod: (podId: string) => void;
}) {
  const ranked = useMemo(
    () =>
      [...podStats]
        .filter((p) => p.expected > 0)
        .sort((a, b) => {
          const scoreA = a.missing + a.partial + a.late;
          const scoreB = b.missing + b.partial + b.late;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return a.podName.localeCompare(b.podName);
        }),
    [podStats],
  );

  if (ranked.length <= 1) return null;

  return (
    <section className="mb-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {ranked.map((p) => {
          const gaps = p.missing + p.partial;
          const active = selectedPodId === p.podId;
          return (
            <button
              key={p.podId}
              type="button"
              onClick={() => onSelectPod(p.podId)}
              title={`${focusDate} — ${p.complete}/${p.expected} present`}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : gaps > 0
                    ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                    : p.late > 0
                      ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium max-w-[120px] truncate">{p.podName}</span>
              <span className="tabular-nums text-[10px] opacity-80">
                {gaps > 0 ? `${gaps} gap${gaps === 1 ? "" : "s"}` : `${p.complete}/${p.expected}`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
