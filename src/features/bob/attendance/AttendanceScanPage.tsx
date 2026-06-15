'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AttendanceScanSkeleton } from "./components/AttendancePageSkeletons";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useAttendanceWorkspace } from "./hooks/useAttendanceWorkspace";
import { resolveStudentName } from "./model/resolveDisplay";
import {
  dayHasTriageIssue,
  triageIssuePriority,
} from "./model/issueDetection";
import { SessionSummary } from "./components/SessionSummary";
import { AttendanceStatusBadge } from "./components/AttendanceStatusBadge";
import { StudentDayDrawer } from "./components/StudentDayDrawer";
import { BulkActionBar } from "./components/BulkActionBar";
import type { StudentDayAttendance } from "./types";
import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useUpsertBobAttendanceDay } from "@/platform/query/hooks/useBobAttendance";
import { parseApiError } from "@/platform/api/errors";

export function AttendanceScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackFromUrl = searchParams?.get("track") || "";
  const podFromUrl =
    searchParams?.get("pod") || searchParams?.get("podId") || "";
  const dateFromUrl = searchParams?.get("date") || "";

  const [trackFilter, setTrackFilter] = useState(trackFromUrl);
  const [podId, setPodId] = useState(podFromUrl);
  const [date, setDate] = useState(
    () => dateFromUrl || new Date().toISOString().slice(0, 10),
  );
  const [selectedDay, setSelectedDay] = useState<StudentDayAttendance | null>(
    null,
  );
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  const { can } = useBobAccess();
  const canMark = can("attendance.mark");
  const upsertDay = useUpsertBobAttendanceDay();

  const podsQuery = useBobPodsList({ limit: 100 });

  const { workspace, loading, error, refetch } = useAttendanceWorkspace({
    focusDate: date,
    podFilter: podId,
    trackFilter,
  });

  const pods = podsQuery.data?.pods ?? [];

  function rowKey(row: StudentDayAttendance) {
    return `${row.podId}|${row.studentId}`;
  }

  function toggleSelected(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleBulkApply(status: BobAttendanceStatus) {
    if (!selectedKeys.size) return;
    setBulkSaving(true);
    setBulkError(null);
    try {
      const rows = issueRows.filter((r) => selectedKeys.has(rowKey(r)));
      for (const row of rows) {
        await upsertDay.mutateAsync({
          studentId: row.studentId,
          podId: row.podId,
          date: row.date,
          status,
        });
      }
      setSelectedKeys(new Set());
      refetch();
    } catch (err) {
      setBulkError(parseApiError(err));
    } finally {
      setBulkSaving(false);
    }
  }

  useEffect(() => {
    if (trackFromUrl) setTrackFilter(trackFromUrl);
  }, [trackFromUrl]);

  useEffect(() => {
    if (podFromUrl) setPodId(podFromUrl);
  }, [podFromUrl]);

  useEffect(() => {
    if (!podId && !trackFilter && pods.length) {
      setPodId(pods[0].id);
    }
  }, [pods, podId, trackFilter]);

  const todayRows = useMemo(
    () =>
      workspace.days.filter(
        (d) =>
          d.date === date && (!podId || d.podId === podId),
      ),
    [workspace.days, date, podId],
  );

  const issueRows = useMemo(() => {
    const source = showAllRows
      ? todayRows
      : todayRows.filter(dayHasTriageIssue);
    return [...source].sort(
      (a, b) => triageIssuePriority(a) - triageIssuePriority(b),
    );
  }, [todayRows, showAllRows]);

  const issueCounts = useMemo(
    () => ({
      missing: todayRows.filter(
        (r) => r.attendanceState === "missing_punch" || r.health === "partial",
      ).length,
      late: todayRows.filter((r) => r.attendanceState === "late" || r.isLate)
        .length,
      manualOverrides: todayRows.filter((r) => r.hasManualCorrection).length,
      autoFilled: todayRows.filter(
        (r) => r.attendanceState === "auto_filled" || r.hasAutoFill,
      ).length,
      gaps: todayRows.filter((r) => r.health === "missing").length,
    }),
    [todayRows],
  );

  const openIssueCount = todayRows.filter(dayHasTriageIssue).length;
  const scopeReady = Boolean(podId || trackFilter);

  if (loading && !todayRows.length) {
    return <AttendanceScanSkeleton />;
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
        Review operational issues for this track and date. Edit attendance in the
        drawer — changes sync to Airtable.
      </p>

      {scopeReady && todayRows.length > 0 ? (
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
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track filter
          </label>
          <input
            type="text"
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            placeholder="e.g. Made@Dent"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pod / track
          </label>
          <select
            value={podId}
            onChange={(e) => setPodId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">
              {trackFilter ? "All pods in track" : "Select track"}
            </option>
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {scopeReady && todayRows.length > 0 ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {showAllRows
              ? `Showing all ${todayRows.length} students`
              : `${openIssueCount} issue${openIssueCount === 1 ? "" : "s"} to triage`}
          </p>
          <button
            type="button"
            onClick={() => setShowAllRows((v) => !v)}
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            {showAllRows ? "Issues only" : "Show all students"}
          </button>
        </div>
      ) : null}

      {!scopeReady ? (
        <p className="text-sm text-gray-500">
          Select a pod or enter a track filter to begin.
        </p>
      ) : todayRows.length === 0 ? (
        <p className="text-sm text-gray-500">
          No attendance records for this scope on this date.
        </p>
      ) : issueRows.length === 0 ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-sm font-medium text-green-800">
            No open issues for this track and date.
          </p>
          <button
            type="button"
            onClick={() => setShowAllRows(true)}
            className="mt-2 text-sm text-green-700 underline"
          >
            View all students
          </button>
        </div>
      ) : (
        <>
          {bulkError ? (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {bulkError}
            </div>
          ) : null}
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white mb-20">
            {issueRows.map((row) => {
              const name = resolveStudentName(row.studentId, workspace.studentById);
              const isIssue = dayHasTriageIssue(row);
              const key = rowKey(row);
              const checked = selectedKeys.has(key);
              return (
                <li
                  key={key}
                  className={`flex items-stretch ${
                    isIssue ? "bg-orange-50/40" : ""
                  }`}
                >
                  {canMark ? (
                    <label className="flex items-center px-3 border-r border-gray-100 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelected(key)}
                        className="rounded border-gray-300 text-orange-600"
                        aria-label={`Select ${name}`}
                      />
                    </label>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedDay(row)}
                    className="flex-1 text-left flex flex-col gap-2 px-3 py-3 hover:bg-orange-50/20"
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
          {canMark ? (
            <BulkActionBar
              selectedCount={selectedKeys.size}
              disabled={bulkSaving}
              onApply={(status) => void handleBulkApply(status)}
              onClear={() => setSelectedKeys(new Set())}
            />
          ) : null}
        </>
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
          onSaved={() => {
            refetch();
            setSelectedDay(null);
          }}
        />
      ) : null}
    </div>
  );
}
