"use client";

import { useEffect, useState } from "react";
import {
  getBlitzPointsLog,
  type BlitzPointsLogEntry,
} from "@/platform/api/bob/blitz";
import { Skeleton } from "@/components/Skeleton";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sourceLabel(entry: BlitzPointsLogEntry) {
  if (entry.isRollup) return "Global rollup";
  if (entry.source === "auto") return "Auto";
  return "Manual";
}

export function BlitzPointsLog({ teamFilter }: { teamFilter?: string }) {
  const [entries, setEntries] = useState<BlitzPointsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getBlitzPointsLog(200)
      .then((data) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load log");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = teamFilter
    ? entries.filter(
        (e) =>
          e.team?.toLowerCase().includes(teamFilter.toLowerCase()) ||
          e.color?.toLowerCase().includes(teamFilter.toLowerCase()),
      )
    : entries;

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!filtered.length) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No point awards logged yet.
      </p>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto rounded-lg border border-amber-200/60 bg-white">
      <ul className="divide-y divide-gray-100 text-sm">
        {filtered.map((entry) => (
          <li key={entry.id} className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {entry.team || "Unknown team"}
                  <span className="text-emerald-700 font-bold tabular-nums ml-1">
                    +{entry.points}
                  </span>
                </p>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                  {entry.reason || "No reason recorded"}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {sourceLabel(entry)}
                  {entry.category ? ` · ${entry.category}` : ""}
                  {entry.awardedBy ? ` · ${entry.awardedBy}` : ""}
                </p>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
                {formatWhen(entry.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
