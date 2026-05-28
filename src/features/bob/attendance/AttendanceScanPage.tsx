'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BOB_ATTENDANCE_STATUSES,
  type BobAttendanceStatus,
} from "@/platform/api/bob/attendance";
import { Skeleton } from "@/components/Skeleton";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { useUpsertBobAttendanceDay } from "@/platform/query/hooks/useBobAttendance";
import { useAttendanceWorkspace } from "./hooks/useAttendanceWorkspace";
import { resolveStudentName } from "./model/resolveDisplay";
import { STATUS_LABELS } from "./model/constants";
import { PunchDots } from "./components/PunchDots";
import { BulkActionBar } from "./components/BulkActionBar";
import { AttendanceStatusBadge } from "./components/AttendanceStatusBadge";

export function AttendanceScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [podId, setPodId] = useState(() => searchParams?.get("pod") || "");
  const [date, setDate] = useState(
    () => searchParams?.get("date") || new Date().toISOString().slice(0, 10),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [localStatus, setLocalStatus] = useState<Map<string, BobAttendanceStatus>>(
    new Map(),
  );

  const podsQuery = useBobPodsList({ limit: 100 });
  const studentsQuery = useBobStudentsList({ limit: 500 });
  const upsert = useUpsertBobAttendanceDay();

  const { workspace, loading, error } = useAttendanceWorkspace({
    focusDate: date,
    podFilter: podId,
  });

  const pods = podsQuery.data?.pods ?? [];

  useEffect(() => {
    if (!podId && pods.length) setPodId(pods[0].id);
  }, [pods, podId]);

  const todayRows = useMemo(
    () => workspace.days.filter((d) => d.date === date && d.podId === podId),
    [workspace.days, date, podId],
  );

  useEffect(() => {
    const m = new Map<string, BobAttendanceStatus>();
    for (const row of todayRows) {
      m.set(row.studentId, row.dailyStatus ?? "present");
    }
    setLocalStatus(m);
  }, [todayRows]);

  const toggleSelect = useCallback((studentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }, []);

  const setOne = useCallback((studentId: string, status: BobAttendanceStatus) => {
    setLocalStatus((prev) => {
      const next = new Map(prev);
      next.set(studentId, status);
      return next;
    });
    if (!podId) return;
    upsert.mutate({ studentId, podId, date, status });
  }, [podId, date, upsert]);

  const applyBulk = useCallback(
    async (status: BobAttendanceStatus) => {
      if (!podId) return;
      const ids = selected.size
        ? Array.from(selected)
        : todayRows.map((r) => r.studentId);
      setLocalStatus((prev) => {
        const next = new Map(prev);
        for (const id of ids) next.set(id, status);
        return next;
      });
      await Promise.all(
        ids.map((studentId) =>
          upsert.mutateAsync({ studentId, podId, date, status }),
        ),
      );
      setSelected(new Set());
    },
    [podId, date, selected, todayRows, upsert],
  );

  if (loading && !todayRows.length) {
    return (
      <div className="px-6 py-8 max-w-3xl">
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-8 w-56 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto pb-24">
      <Link
        href="/app/bob/attendance"
        className="text-sm text-orange-600 hover:underline"
      >
        ← Attendance dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Scan mode</h1>
      <p className="text-gray-600 text-sm mb-6">
        Rapid daily marking with optimistic updates. Tap a status or bulk-select rows.
      </p>

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pod</label>
          <select
            value={podId}
            onChange={(e) => setPodId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select pod</option>
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {!podId ? (
        <p className="text-sm text-gray-500">Select a pod to begin scanning.</p>
      ) : todayRows.length === 0 ? (
        <p className="text-sm text-gray-500">No students assigned to this pod.</p>
      ) : (
        <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
          {todayRows.map((row) => {
            const name = resolveStudentName(row.studentId, workspace.studentById);
            const status = localStatus.get(row.studentId) ?? "present";
            return (
              <li
                key={row.studentId}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-3 hover:bg-orange-50/30"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(row.studentId)}
                    onChange={() => toggleSelect(row.studentId)}
                    className="rounded border-gray-300 text-orange-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PunchDots punches={row.punches} />
                      <AttendanceStatusBadge health={row.health} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 sm:justify-end">
                  {BOB_ATTENDANCE_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOne(row.studentId, st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        status === st
                          ? "border-orange-500 bg-orange-50 text-orange-800"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/app/bob/attendance")}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          Done
        </button>
        <button
          type="button"
          onClick={() => applyBulk("present")}
          disabled={!podId || upsert.isPending}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Mark all present
        </button>
      </div>

      <BulkActionBar
        selectedCount={selected.size}
        onApply={applyBulk}
        onClear={() => setSelected(new Set())}
        disabled={upsert.isPending}
      />
    </div>
  );
}
