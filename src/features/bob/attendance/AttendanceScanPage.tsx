'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/Skeleton";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useAttendanceWorkspace } from "./hooks/useAttendanceWorkspace";
import { resolveStudentName } from "./model/resolveDisplay";
import { SessionSummary } from "./components/SessionSummary";
import { AttendanceStatusBadge } from "./components/AttendanceStatusBadge";
import { StudentDayDrawer } from "./components/StudentDayDrawer";
import type { StudentDayAttendance } from "./types";

export function AttendanceScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [podId, setPodId] = useState(() => searchParams?.get("pod") || "");
  const [date, setDate] = useState(
    () => searchParams?.get("date") || new Date().toISOString().slice(0, 10),
  );
  const [selectedDay, setSelectedDay] = useState<StudentDayAttendance | null>(null);

  const podsQuery = useBobPodsList({ limit: 100 });

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

  const issueRows = useMemo(() => {
    const priority = (row: StudentDayAttendance) => {
      if (row.attendanceState === "missing_punch" || row.health === "partial") return 0;
      if (row.attendanceState === "late") return 1;
      if (row.hasManualCorrection) return 2;
      if (row.attendanceState === "auto_filled") return 3;
      if (row.health === "missing") return 4;
      return 5;
    };
    return [...todayRows].sort((a, b) => priority(a) - priority(b));
  }, [todayRows]);

  const issueCounts = useMemo(
    () => ({
      missing: todayRows.filter(
        (r) => r.attendanceState === "missing_punch" || r.health === "partial",
      ).length,
      late: todayRows.filter((r) => r.attendanceState === "late" || r.isLate).length,
      manualOverrides: todayRows.filter((r) => r.hasManualCorrection).length,
      autoFilled: todayRows.filter((r) => r.attendanceState === "auto_filled").length,
      gaps: todayRows.filter((r) => r.health === "missing").length,
    }),
    [todayRows],
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
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto pb-12">
      <Link
        href="/app/bob/attendance"
        className="text-sm text-orange-600 hover:underline"
      >
        ← Attendance dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Issue triage</h1>
      <p className="text-gray-600 text-sm mb-6">
        Review operational issues for this track and date. Attendance changes happen in Airtable.
      </p>

      {podId && todayRows.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "Missing punches", count: issueCounts.missing },
            { label: "Late", count: issueCounts.late },
            { label: "Manual overrides", count: issueCounts.manualOverrides },
            { label: "Auto filled", count: issueCounts.autoFilled },
            { label: "Gaps", count: issueCounts.gaps },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center"
            >
              <p className="text-lg font-bold text-gray-900">{item.count}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
          <select
            value={podId}
            onChange={(e) => setPodId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select track</option>
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
        <p className="text-sm text-gray-500">Select a track to begin.</p>
      ) : todayRows.length === 0 ? (
        <p className="text-sm text-gray-500">No attendance records for this track on this date.</p>
      ) : (
        <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
          {issueRows.map((row) => {
            const name = resolveStudentName(row.studentId, workspace.studentById);
            const isIssue =
              row.attendanceState === "missing_punch" ||
              row.isLate ||
              row.hasManualCorrection ||
              row.attendanceState === "auto_filled";
            return (
              <li key={row.studentId}>
                <button
                  type="button"
                  onClick={() => setSelectedDay(row)}
                  className={`w-full text-left flex flex-col gap-2 px-3 py-3 ${
                    isIssue ? "bg-orange-50/40" : "hover:bg-orange-50/20"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    <AttendanceStatusBadge
                      health={row.health}
                      attendanceState={row.attendanceState}
                    />
                  </div>
                  <SessionSummary day={row} compact />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => router.push("/app/bob/attendance")}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          Back to dashboard
        </button>
      </div>

      {selectedDay ? (
        <StudentDayDrawer
          day={selectedDay}
          workspace={workspace}
          onClose={() => setSelectedDay(null)}
        />
      ) : null}
    </div>
  );
}
