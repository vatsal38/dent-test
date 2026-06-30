"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { KpiGrid, type KpiItem } from "@/design-system/patterns/KpiGrid";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import {
  useBobWellnessStats,
  useBobWellnessWeek,
} from "@/platform/query/hooks/useBobWellness";
import { useBobStudentsFacets } from "@/platform/query/hooks/useBobStudents";
import { rosterTrackFilterOptions } from "@/lib/bobRosterTrackOptions";
import { Skeleton } from "@/components/Skeleton";

export function WellnessCheckPage() {
  const { data: me } = useBobMe();
  const facetsQuery = useBobStudentsFacets();
  const [weekIndex, setWeekIndex] = useState<number | undefined>(undefined);
  const [trackFilter, setTrackFilter] = useState("");
  const [search, setSearch] = useState("");

  const podId =
    me?.coachScope && me?.primaryPod?.id ? me.primaryPod.id : undefined;

  const weekParams = useMemo(
    () => ({
      weekIndex,
      track: trackFilter || undefined,
      podId,
      search: search.trim() || undefined,
    }),
    [weekIndex, trackFilter, podId, search],
  );

  const statsParams = useMemo(
    () => ({
      weekIndex,
      track: trackFilter || undefined,
      podId,
    }),
    [weekIndex, trackFilter, podId],
  );

  const weekQuery = useBobWellnessWeek(weekParams);
  const statsQuery = useBobWellnessStats(statsParams);

  const weekData = weekQuery.data;
  const statsData = statsQuery.data;
  const loading = weekQuery.isLoading;

  const activeWeekIndex =
    weekIndex ?? weekData?.week?.weekIndex ?? weekData?.programWeeks?.at(-1)?.weekIndex;

  const trackOptions = rosterTrackFilterOptions(facetsQuery.data?.tracks ?? []);

  const kpis: KpiItem[] = [
    {
      id: "completed",
      label: "Check-ins completed",
      value: weekData
        ? `${weekData.summary.completed}/${weekData.summary.total}`
        : "—",
    },
    {
      id: "pending",
      label: "Still needed",
      value: weekData?.summary.pending ?? "—",
    },
    {
      id: "overall",
      label: "Average score",
      value:
        statsData?.overall != null ? statsData.overall.toFixed(1) : "—",
      hint:
        statsData?.overallCount != null
          ? `${statsData.overallCount} students scored`
          : undefined,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        eyebrow="Coach tools"
        title="Weekly Check-in"
        description="See which students still need a wellness check-in this week and track average scores by track."
        actions={
          <Link
            href="/app/bob/submit?type=wellness_check"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Submit check-in
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Program week
          </label>
          <select
            value={activeWeekIndex ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setWeekIndex(v ? Number(v) : undefined);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {(weekData?.programWeeks ?? []).map((w) => (
              <option key={w.weekIndex} value={w.weekIndex}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Track
          </label>
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All tracks</option>
            {trackOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Search students
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, school, email…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <KpiGrid items={kpis} loading={loading} />

      {statsData?.byTrack?.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Average wellness score by track
          </h2>
          <div className="flex flex-wrap gap-3">
            {statsData.byTrack.map((row) => (
              <div
                key={row.track}
                className="rounded-lg border border-gray-200 px-4 py-3 min-w-[140px]"
              >
                <p className="text-xs text-gray-500">{row.track}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {row.average.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">{row.count} students</p>
              </div>
            ))}
            {statsData.overall != null ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 min-w-[140px]">
                <p className="text-xs text-orange-800">Overall</p>
                <p className="text-2xl font-bold text-orange-900 tabular-nums">
                  {statsData.overall.toFixed(1)}
                </p>
                <p className="text-xs text-orange-800">
                  {statsData.overallCount} students
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {weekData?.week?.label ?? "This week"} — student check-ins
          </h2>
          {me?.primaryPod?.name ? (
            <span className="text-xs text-gray-500">{me.primaryPod.name}</span>
          ) : null}
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Track</th>
                  <th className="px-4 py-3 font-medium text-center">
                    Completed
                  </th>
                  <th className="px-4 py-3 font-medium text-center">Score</th>
                  <th className="px-4 py-3 font-medium">Why</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(weekData?.rows ?? []).map((row) => (
                  <tr key={row.studentId} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/app/bob/roster?id=${encodeURIComponent(row.studentId)}`}
                        className="hover:text-orange-600"
                      >
                        {row.studentName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.track}</td>
                    <td className="px-4 py-3 text-center">
                      {row.completed ? (
                        <span className="text-emerald-600 font-semibold" title="Completed">
                          ✓
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold" title="Not yet">
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums font-semibold text-gray-900">
                      {row.wellnessScore ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {row.wellnessReason || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.completed ? (
                        <span className="text-xs text-gray-400">Done</span>
                      ) : (
                        <Link
                          href={`/app/bob/submit?type=wellness_check&studentId=${encodeURIComponent(row.studentId)}`}
                          className="text-xs font-semibold text-orange-600 hover:underline"
                        >
                          Check in
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {!weekData?.rows?.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No students match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
