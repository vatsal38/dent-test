'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/Skeleton";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";
import { getDaysInRange, getWeekMonday, getWeekSunday } from "./weekDates";
import { useAttendanceWorkspace } from "./hooks/useAttendanceWorkspace";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { filterDaysByHealth } from "./model/computeWorkspace";
import { ATTENDANCE_PAGE_SIZE } from "./model/scale";
import { AttendanceAlertStrip } from "./components/AttendanceAlertStrip";
import { AttendanceHealthBar } from "./components/AttendanceHealthBar";
import { AttendancePodQueue } from "./components/AttendancePodQueue";
import { AttendanceScaleBanner } from "./components/AttendanceScaleBanner";
import { AttendanceTableToolbar } from "./components/AttendanceTableToolbar";
import { DailyAttendanceTable } from "./components/DailyAttendanceTable";
import { PodSiteAnalytics } from "./components/PodSiteAnalytics";
import { PunchLegend } from "./components/PunchDots";
import { StudentDayDrawer } from "./components/StudentDayDrawer";
import type { StudentDayAttendance } from "./types";

export function AttendanceHubPage() {
  const searchParams = useSearchParams();
  const podSelectRef = useRef<HTMLSelectElement>(null);
  const initialDate =
    searchParams?.get("date") || new Date().toISOString().slice(0, 10);
  const initialPod = searchParams?.get("pod") || "";
  const initialFilter = (searchParams?.get("filter") || "all") as
    | "all"
    | "missing"
    | "late"
    | "complete";

  const [focusDate, setFocusDate] = useState(initialDate);
  const [podFilter, setPodFilter] = useState(initialPod);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [healthFilter, setHealthFilter] = useState(initialFilter);
  const [selectedDay, setSelectedDay] = useState<StudentDayAttendance | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    // Keep UI state in sync with URL params so alert clicks apply filters.
    const nextDate =
      searchParams?.get("date") || new Date().toISOString().slice(0, 10);
    const nextPod = searchParams?.get("pod") || "";
    const rawFilter = (searchParams?.get("filter") || "all") as string;
    const nextFilter = (["all", "missing", "late", "complete"] as const).includes(
      rawFilter as any,
    )
      ? (rawFilter as "all" | "missing" | "late" | "complete")
      : "all";

    setFocusDate((cur) => (cur === nextDate ? cur : nextDate));
    setPodFilter((cur) => (cur === nextPod ? cur : nextPod));
    setHealthFilter((cur) => (cur === nextFilter ? cur : nextFilter));
  }, [searchParams]);

  const { workspace, pods, loading, error, isRefreshing, refetch, lastSyncedAt } =
    useAttendanceWorkspace({
      focusDate,
      weekMode: viewMode === "week",
      podFilter,
    });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, podFilter, healthFilter, focusDate, viewMode]);

  useEffect(() => {
    if (workspace.scale.weekViewHeavy && viewMode === "week" && !podFilter) {
      setViewMode("day");
    }
  }, [workspace.scale.weekViewHeavy, viewMode, podFilter]);

  useEffect(() => {
    // For very large rosters, org-wide queries are capped. Auto-pick a pod to keep
    // health indicators and alerts accurate, without forcing extra clicks.
    if (workspace.scale.requiresPodScope && !podFilter && pods.length > 0) {
      setPodFilter(pods[0].id);
      setViewMode("day");
      setSelectedDay(null);
      setPage(1);
    }
  }, [workspace.scale.requiresPodScope, podFilter, pods]);

  const weekDates = useMemo(() => {
    if (viewMode !== "week") return [focusDate];
    const mon = getWeekMonday(new Date(focusDate + "T12:00:00"));
    const sun = getWeekSunday(mon);
    return getDaysInRange(mon, sun);
  }, [viewMode, focusDate]);

  const tableDays = useMemo(() => {
    const scoped =
      viewMode === "week"
        ? workspace.days
        : workspace.days.filter((d) => d.date === focusDate);
    return filterDaysByHealth(scoped, healthFilter);
  }, [workspace.days, viewMode, focusDate, healthFilter]);

  const rowCount = useMemo(() => {
    const keys = new Set<string>();
    for (const d of tableDays) keys.add(`${d.podId}|${d.studentId}`);
    return keys.size;
  }, [tableDays]);

  const exportCsv = useCallback(() => {
    const headers = ["Date", "Pod", "Student", "Health", "Missing punches"];
    const rows = tableDays.map((d) => {
      const student = workspace.studentById.get(d.studentId);
      const pod = workspace.podById.get(d.podId);
      const name = student
        ? `${student.firstName} ${student.lastName}`.trim()
        : "Unknown";
      return [
        d.date,
        pod?.name ?? "",
        name,
        d.health,
        String(d.missingPunchCount),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${focusDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tableDays, workspace]);

  if (loading) {
    return (
      <div className="p-6 sm:p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 flex-1" rounded="lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    );
  }

  const showPodQueue = !podFilter && pods.length > 1;

  return (
    <div className={`p-4 sm:p-6 lg:p-8 ${isRefreshing ? "opacity-90" : ""}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 text-sm mt-1">
            Summary-first ops — filter by pod, resolve gaps in scan mode.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Refresh
          </button>
          <span className="text-xs text-gray-500">
            {lastSyncedAt
              ? `Updated ${Math.max(1, Math.floor((Date.now() - lastSyncedAt.getTime()) / 60000))}m ago`
              : ""}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!tableDays.length}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
          >
            Export
          </button>
          <Link
            href="/app/bob/attendance/discrepancies"
            className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm font-medium hover:bg-amber-100"
          >
            Issues ({workspace.summary.openDiscrepancies})
          </Link>
          <BobPermissionGuard permission="attendance.mark" silent>
            <Link
              href={`/app/bob/attendance/mark?date=${focusDate}${podFilter ? `&pod=${podFilter}` : ""}`}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
            >
              Scan mode
            </Link>
          </BobPermissionGuard>
        </div>
      </div>

      <AttendanceScaleBanner
        scale={workspace.scale}
        onSelectPod={() => podSelectRef.current?.focus()}
      />

      <AttendanceAlertStrip
        alerts={workspace.alerts}
        truncatedCount={workspace.scale.alertsTruncated}
      />
      <AttendanceHealthBar summary={workspace.summary} date={focusDate} />

      {showPodQueue ? (
        <AttendancePodQueue
          podStats={workspace.podStats}
          focusDate={focusDate}
          selectedPodId={podFilter}
          onSelectPod={setPodFilter}
        />
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <input
          type="date"
          value={focusDate}
          onChange={(e) => setFocusDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
        />
        <select
          ref={podSelectRef}
          value={podFilter}
          onChange={(e) => setPodFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 min-w-[140px]"
        >
          <option value="">
            {workspace.scale.requiresPodScope
              ? "Select a pod…"
              : "All pods"}
          </option>
          {pods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
          {(["day", "week"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={m === "week" && workspace.scale.weekViewHeavy && !podFilter}
              title={
                m === "week" && workspace.scale.weekViewHeavy && !podFilter
                  ? "Select a pod for week view at this size"
                  : undefined
              }
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize disabled:opacity-40 ${
                viewMode === m ? "bg-white shadow text-orange-700" : "text-gray-600"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
          {(
            [
              ["missing", "Gaps"],
              ["late", "Late"],
              ["complete", "Complete"],
              ["all", "All"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setHealthFilter(k)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                healthFilter === k ? "bg-white shadow text-orange-700" : "text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <PunchLegend />
      </div>

      {!workspace.scale.requiresPodScope || podFilter ? (
        <>
          <AttendanceTableToolbar
            search={search}
            onSearchChange={setSearch}
            page={page}
            totalRows={rowCount}
            onPageChange={setPage}
            showingLabel={
              workspace.scale.enrollmentCount > ATTENDANCE_PAGE_SIZE
                ? `Page ${page} · ${rowCount} student${rowCount === 1 ? "" : "s"} in view`
                : undefined
            }
          />
          <DailyAttendanceTable
            days={tableDays}
            workspace={workspace}
            focusDate={focusDate}
            weekDates={viewMode === "week" ? weekDates : undefined}
            onSelectDay={setSelectedDay}
            search={debouncedSearch}
            page={page}
          />
        </>
      ) : (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
          Choose a pod above to load the student grid, or use the pod queue to jump
          to pods with open gaps.
        </div>
      )}

      {podFilter || !workspace.scale.recommendPodScope ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Pod analytics</h2>
          <PodSiteAnalytics podStats={workspace.podStats} />
        </section>
      ) : null}

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
