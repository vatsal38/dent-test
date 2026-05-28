"use client";

import { useMemo } from "react";
import Link from "next/link";
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
    <section className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-900">Pod queue</h2>
        <p className="text-xs text-gray-500">Tap a pod to focus — issues first</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {ranked.map((p) => {
          const gaps = p.missing + p.partial;
          const active = selectedPodId === p.podId;
          const tone =
            gaps > 0
              ? "border-red-200 bg-red-50 hover:bg-red-100/80"
              : p.late > 0
                ? "border-amber-200 bg-amber-50 hover:bg-amber-100/80"
                : "border-gray-200 bg-white hover:bg-gray-50";
          return (
            <button
              key={p.podId}
              type="button"
              onClick={() => onSelectPod(p.podId)}
              className={`text-left rounded-lg border p-3 transition-colors ${tone} ${
                active ? "ring-2 ring-orange-500 ring-offset-1" : ""
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 truncate">{p.podName}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {p.complete}/{p.expected} complete
                {gaps > 0 ? ` · ${gaps} gap${gaps === 1 ? "" : "s"}` : ""}
                {p.late > 0 ? ` · ${p.late} late` : ""}
              </p>
              {gaps > 0 ? (
                <Link
                  href={`/app/bob/attendance/mark?pod=${p.podId}&date=${focusDate}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 inline-block text-xs font-medium text-orange-700 hover:underline"
                >
                  Scan mode →
                </Link>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
