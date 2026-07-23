"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AttendanceHubSkeleton } from "./components/AttendancePageSkeletons";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";
import { getCalendarMonthBounds, getWeekMonday, getWeekSunday } from "./weekDates";
import {
  useAttendanceWorkspace,
  type AttendanceViewMode,
} from "./hooks/useAttendanceWorkspace";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { filterDaysByHealth } from "./model/computeWorkspace";
import { ATTENDANCE_PAGE_SIZE } from "./model/scale";
import { AttendanceHubControls } from "./components/AttendanceHubControls";
import { AttendanceHoursRollup } from "./components/AttendanceHoursRollup";
import { AttendanceScaleBanner } from "./components/AttendanceScaleBanner";
import { DailyAttendanceTable } from "./components/DailyAttendanceTable";
import { MonthlyAttendanceView } from "./components/MonthlyAttendanceView";
import { StudentMyAttendanceCards } from "./components/StudentMyAttendanceCards";
import { PodSiteAnalytics } from "./components/PodSiteAnalytics";
import { BOB_POD_SINGULAR } from "@/lib/bobDisplayTerminology";
import { StudentDayDrawer } from "./components/StudentDayDrawer";
import type { IssueFilter, StudentDayAttendance } from "./types";
import { parseApiError } from "@/platform/api/errors";
import { ErrorToast } from "@/components/ErrorToast";
import { BobActionButton } from "@/features/bob/ui/BobActionButton";
import {
  FiAlertTriangle,
  FiDownload,
  FiRefreshCw,
  FiZap,
} from "react-icons/fi";
import { BobImportProgress } from "@/components/BobImportProgress";
import {
  getBobAttendanceImportStatus,
  startBobAttendanceImport,
} from "@/platform/api/bob";
import { useBobAttendanceDateBounds } from "@/platform/query/hooks/useBobAttendance";
import { useBobStudentsFacets } from "@/platform/query/hooks/useBobStudents";
import { rosterTrackFilterOptions } from "@/lib/bobRosterTrackOptions";
import { buildHoursAttendanceRollup } from "./model/hoursRollup";
import { buildAttendanceCsv } from "./model/attendanceCsvExport";
import {
  resolveAttendanceExportRange,
  selectAttendanceExportDays,
} from "./model/attendanceExportSelection";
import { computeAttendanceWorkspace } from "./model/computeWorkspace";
import { getAllBobAttendance } from "@/platform/api/bob/attendance";
import {
  isBeforeProgramStart,
  PROGRAM_END_DATE,
  PROGRAM_START_DATE,
  resolveAttendancePickerMinDate,
  resolveDefaultAttendanceFocusDate,
  listProgramDates,
} from "@/lib/bobProgramCalendar";

export function AttendanceHubPage() {
  const searchParams = useSearchParams();
  const trackSelectRef = useRef<HTMLSelectElement>(null);
  const initialDate =
    searchParams?.get("date") || resolveDefaultAttendanceFocusDate();
  const initialTrack = searchParams?.get("track") || "";
  const initialFilter = (searchParams?.get("filter") || "all") as IssueFilter;

  const [focusDate, setFocusDate] = useState(initialDate);
  const [trackFilter, setTrackFilter] = useState(initialTrack);
  const [viewMode, setViewMode] = useState<AttendanceViewMode>("day");
  const [healthFilter, setHealthFilter] = useState<IssueFilter>(initialFilter);
  const [selectedDay, setSelectedDay] = useState<StudentDayAttendance | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [dateAutoAdjusted, setDateAutoAdjusted] = useState(false);
  const boundsQuery = useBobAttendanceDateBounds();

  useEffect(() => {
    // Keep UI state in sync with URL params so alert clicks apply filters.
    const nextDate =
      searchParams?.get("date") ||
      resolveDefaultAttendanceFocusDate({
        latestImportedDate: boundsQuery.data?.latestDate,
      });
    const nextTrack = searchParams?.get("track") || "";
    const rawFilter = (searchParams?.get("filter") || "all") as string;
    const allowed: IssueFilter[] = [
      "all",
      "missing",
      "late",
      "complete",
      "excused",
      "absent",
      "auto_filled",
      "corrections",
      "correction_requests",
      "conflicts",
    ];
    const nextFilter = allowed.includes(rawFilter as IssueFilter)
      ? (rawFilter as IssueFilter)
      : "all";

    setFocusDate((cur) => (cur === nextDate ? cur : nextDate));
    setTrackFilter((cur) => (cur === nextTrack ? cur : nextTrack));
    setHealthFilter((cur) => (cur === nextFilter ? cur : nextFilter));
  }, [searchParams, boundsQuery.data?.latestDate]);

  const {
    workspace,
    weekDaysForRollup,
    programDaysForRollup,
    loading,
    error,
    isRefreshing,
    refetch,
    lastSyncedAt,
    isStudentViewer,
    linkedStudentId,
    pods,
    enrollmentCount,
  } = useAttendanceWorkspace({
    focusDate,
    viewMode,
    trackFilter,
  });

  const [exporting, setExporting] = useState(false);

  const hoursRollup = useMemo(
    () =>
      buildHoursAttendanceRollup({
        students: workspace.students,
        focusDate,
        todayDays: workspace.days.filter((d) => d.date === focusDate),
        weekDays: weekDaysForRollup,
        programDays: programDaysForRollup,
      }),
    [
      workspace.students,
      workspace.days,
      focusDate,
      weekDaysForRollup,
      programDaysForRollup,
    ],
  );

  const { data: rosterFacets, isLoading: rosterFacetsLoading } =
    useBobStudentsFacets({ enabled: !isStudentViewer });
  const trackOptions = useMemo(
    () => rosterTrackFilterOptions(rosterFacets ?? null),
    [rosterFacets],
  );

  const latestImportedDate = boundsQuery.data?.latestDate ?? null;
  const earliestImportedDate = boundsQuery.data?.earliestDate ?? null;
  const boundsTotal = boundsQuery.data?.total ?? 0;
  const datePickerMin = resolveAttendancePickerMinDate(earliestImportedDate);
  const suggestedFocusDate =
    boundsQuery.data?.suggestedFocusDate ??
    resolveDefaultAttendanceFocusDate({ latestImportedDate });

  useEffect(() => {
    if (searchParams?.get("date")) return;
    if (!boundsQuery.data) return;
    setFocusDate((cur) =>
      cur === suggestedFocusDate ? cur : suggestedFocusDate,
    );
    setDateAutoAdjusted(true);
  }, [searchParams, boundsQuery.data, suggestedFocusDate]);

  useEffect(() => {
    if (dateAutoAdjusted || searchParams?.get("date")) return;
    if (!latestImportedDate || boundsTotal === 0) return;
    if (focusDate > latestImportedDate) {
      setFocusDate(latestImportedDate);
      setDateAutoAdjusted(true);
    }
  }, [
    dateAutoAdjusted,
    searchParams,
    latestImportedDate,
    boundsTotal,
    focusDate,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, trackFilter, healthFilter, focusDate, viewMode]);

  const weekDates = useMemo(() => {
    if (viewMode !== "week") return [focusDate];
    const mon = getWeekMonday(new Date(focusDate + "T12:00:00"));
    const sun = getWeekSunday(mon);
    return listProgramDates({
      startDate: mon,
      endDate: sun,
      throughDate: sun,
    });
  }, [viewMode, focusDate]);

  const monthDates = useMemo(() => {
    if (viewMode !== "month") return [];
    const bounds = getCalendarMonthBounds(focusDate);
    const start =
      bounds.startDate < PROGRAM_START_DATE
        ? PROGRAM_START_DATE
        : bounds.startDate;
    const end =
      bounds.endDate > PROGRAM_END_DATE ? PROGRAM_END_DATE : bounds.endDate;
    return listProgramDates({
      startDate: start,
      endDate: end,
      throughDate: end,
    });
  }, [viewMode, focusDate]);

  const tableDays = useMemo(() => {
    const scoped =
      viewMode === "week" || viewMode === "month"
        ? workspace.days
        : workspace.days.filter((d) => d.date === focusDate);
    return filterDaysByHealth(scoped, healthFilter);
  }, [workspace.days, viewMode, focusDate, healthFilter]);

  const rowCount = useMemo(() => {
    const keys = new Set<string>();
    for (const d of tableDays) keys.add(d.studentId);
    return keys.size;
  }, [tableDays]);

  const alertCount = useMemo(
    () => workspace.alerts.reduce((sum, a) => sum + (a.count || 0), 0),
    [workspace.alerts],
  );

  const exportCsv = useCallback(async () => {
    setExporting(true);
    setSyncError(null);
    try {
      const range = resolveAttendanceExportRange(viewMode, focusDate);
      const recordsResponse = await getAllBobAttendance({
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 5000,
      });

      const exportWorkspace = computeAttendanceWorkspace({
        focusDate,
        startDate: range.startDate,
        endDate: range.endDate,
        trackFilter: trackFilter || undefined,
        pods,
        students: workspace.students,
        records: recordsResponse.attendance,
        enrollmentCount,
        studentsRequested: workspace.students.length,
        studentOnlyId: null,
      });

      const exportDays = selectAttendanceExportDays({
        days: exportWorkspace.days,
        workspace: exportWorkspace,
        healthFilter,
        search: debouncedSearch,
        focusDate,
      });

      if (!exportDays.length) {
        setSyncError(
          "No attendance rows match your current Day/Week/Month view, filters, and search.",
        );
        return;
      }

      const csv = buildAttendanceCsv(exportDays, exportWorkspace);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const trackPart = trackFilter
        ? `-${trackFilter.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40)}`
        : "";
      const filterPart =
        healthFilter && healthFilter !== "all" ? `-${healthFilter}` : "";
      a.download = `attendance-${range.fileLabel}${trackPart}${filterPart}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setSyncError(parseApiError(err) || "Failed to export attendance.");
    } finally {
      setExporting(false);
    }
  }, [
    viewMode,
    focusDate,
    trackFilter,
    healthFilter,
    debouncedSearch,
    pods,
    workspace.students,
    enrollmentCount,
  ]);

  if (loading) {
    return <AttendanceHubSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 lg:p-6 ${isRefreshing ? "opacity-90" : ""}`}>
      <ErrorToast
        isOpen={Boolean(syncError)}
        message={syncError || ""}
        onClose={() => setSyncError(null)}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {isStudentViewer ? "My attendance" : "Attendance"}
          </h1>
          {isStudentViewer ? (
            <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
              Program-day hours and attendance % match your roster profile.
              Open a correction form for absences or punch fixes.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {!isStudentViewer ? (
            <>
              <div className="relative">
                <BobActionButton
                  label={`Alerts (${alertCount})`}
                  icon={<FiAlertTriangle />}
                  variant={alertCount > 0 ? "warning" : "outline"}
                  onClick={() => setAlertsOpen((v) => !v)}
                  title="View alerts"
                  className="select-none"
                />
                {alertsOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-[360px] max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden"
                    role="menu"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">
                        Alerts
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlertsOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Close
                      </button>
                    </div>
                    <div className="max-h-[360px] overflow-auto">
                      {workspace.alerts.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-gray-600">
                          No alerts.
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {workspace.alerts.map((a) => {
                            const sev =
                              a.severity === "critical"
                                ? "bg-red-50 text-red-800 border-red-200"
                                : a.severity === "warning"
                                  ? "bg-amber-50 text-amber-900 border-amber-200"
                                  : "bg-gray-50 text-gray-800 border-gray-200";
                            const row = (
                              <div className="px-3 py-3 hover:bg-gray-50">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {a.title}
                                    </div>
                                    {a.body ? (
                                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {a.body}
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full border ${sev}`}
                                    >
                                      {a.count}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                            return (
                              <li key={a.id} role="menuitem">
                                {a.href ? (
                                  <Link
                                    href={a.href}
                                    onClick={() => setAlertsOpen(false)}
                                    className="block"
                                  >
                                    {row}
                                  </Link>
                                ) : (
                                  row
                                )}
                              </li>
                            );
                          })}
                          {workspace.scale.alertsTruncated ? (
                            <li>
                              <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50">
                                Showing top alerts (truncated:{" "}
                                {workspace.scale.alertsTruncated})
                              </div>
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <BobActionButton
                label={exporting ? "Exporting…" : "Export"}
                icon={<FiDownload />}
                variant="outline"
                disabled={exporting}
                onClick={exportCsv}
                title={`Export ${viewMode} attendance for your current filters`}
              />
              <BobActionButton
                href="/app/bob/attendance/discrepancies"
                label={`Attendance corrections (${workspace.summary.openDiscrepancies})`}
                icon={<FiAlertTriangle />}
                variant={
                  workspace.summary.openDiscrepancies ? "warning" : "outline"
                }
              />
              <BobPermissionGuard permission="attendance.mark" silent>
                <BobActionButton
                  href={`/app/bob/attendance/mark?date=${focusDate}${trackFilter ? `&track=${encodeURIComponent(trackFilter)}` : ""}`}
                  label="Issue triage"
                  icon={<FiZap />}
                  variant="primary"
                />
              </BobPermissionGuard>
            </>
          ) : null}
          <BobActionButton
            label="Refresh"
            icon={<FiRefreshCw />}
            variant="outline"
            onClick={() => refetch()}
          />
        </div>
      </div>

      {!isStudentViewer ? (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <BobImportProgress
            className="flex-1 min-w-[200px] [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-xs [&_button]:rounded-md"
            label="attendance"
            fetchStatus={getBobAttendanceImportStatus}
            startImport={startBobAttendanceImport}
            onComplete={() => refetch()}
            compact
          />
          <AttendanceScaleBanner
            scale={workspace.scale}
            onSelectTrack={() => trackSelectRef.current?.focus()}
            inline
          />
        </div>
      ) : null}

      {boundsTotal > 0 &&
      latestImportedDate &&
      focusDate > latestImportedDate ? (
        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          No Airtable attendance on <strong>{focusDate}</strong>. Imported data
          runs through <strong>{latestImportedDate}</strong> (
          {boundsTotal.toLocaleString()} records).{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => setFocusDate(latestImportedDate)}
          >
            Jump to latest date
          </button>
        </div>
      ) : null}

      <AttendanceHubControls
        focusDate={focusDate}
        onFocusDateChange={setFocusDate}
        trackFilter={trackFilter}
        onTrackFilterChange={setTrackFilter}
        trackOptions={trackOptions}
        tracksLoading={rosterFacetsLoading}
        requiresScope={false}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
        summary={workspace.summary}
        issues={workspace.issues}
        search={isStudentViewer ? "" : search}
        onSearchChange={isStudentViewer ? () => {} : setSearch}
        page={page}
        totalRows={rowCount}
        onPageChange={setPage}
        trackSelectRef={trackSelectRef}
        hideTrackFilter={isStudentViewer}
        hideSearch={isStudentViewer}
        hideWeekMode={isStudentViewer}
        hideHealthFilters={isStudentViewer}
        hideSummaryBar={isStudentViewer}
        minDate={datePickerMin}
        maxDate={PROGRAM_END_DATE}
      />

      {isStudentViewer ? (
        <StudentMyAttendanceCards
          days={workspace.days}
          student={workspace.students[0]}
          focusDate={focusDate}
          linkedStudentMissing={!linkedStudentId}
        />
      ) : (
        <>
          <AttendanceHoursRollup
            rollup={hoursRollup}
            focusDate={focusDate}
            trackFilter={trackFilter}
          />

          {viewMode === "month" ? (
            <MonthlyAttendanceView
              days={tableDays}
              workspace={workspace}
              focusDate={focusDate}
              monthDates={monthDates}
              onSelectDay={setSelectedDay}
              onFocusDateChange={setFocusDate}
              search={debouncedSearch}
              page={page}
              onPageChange={setPage}
            />
          ) : (
            <DailyAttendanceTable
              days={tableDays}
              workspace={workspace}
              focusDate={focusDate}
              weekDates={viewMode === "week" ? weekDates : undefined}
              onSelectDay={setSelectedDay}
              search={debouncedSearch}
              page={page}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <section className={isStudentViewer ? "hidden" : "mt-8"}>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          {BOB_POD_SINGULAR} check-in today
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Punch completion by {BOB_POD_SINGULAR.toLowerCase()} for {focusDate} —
          use the hours rollup above for BoB and track totals.
        </p>
        <PodSiteAnalytics podStats={workspace.podStats} />
      </section>

      {selectedDay && !isStudentViewer ? (
        <StudentDayDrawer
          day={selectedDay}
          workspace={workspace}
          onClose={() => setSelectedDay(null)}
          onSaved={() => refetch()}
        />
      ) : null}
    </div>
  );
}
