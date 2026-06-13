'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/Skeleton";
import { RosterTrackScopeSelect } from "@/components/bob/RosterTrackScopeSelect";
import { rosterTrackFilterOptions } from "@/lib/bobRosterTrackOptions";
import { useBobStudentsFacets } from "@/platform/query/hooks/useBobStudents";
import { getWeekMonday, getWeekSunday } from "./weekDates";
import { isBeforeProgramStart, PROGRAM_START_DATE, PROGRAM_END_DATE } from "@/lib/bobProgramCalendar";
import { useAttendanceWorkspace } from "./hooks/useAttendanceWorkspace";
import { DiscrepancyList } from "./components/DiscrepancyList";
import { StudentDayDrawer } from "./components/StudentDayDrawer";
import type { AttendanceDiscrepancy, StudentDayAttendance } from "./types";

export function AttendanceDiscrepanciesPage() {
  const searchParams = useSearchParams();
  const initialTrack = searchParams?.get("track") || "";
  const initialDate = searchParams?.get("date") || new Date().toISOString().slice(0, 10);

  const [weekOf, setWeekOf] = useState(() => getWeekMonday(new Date(initialDate + "T12:00:00")));
  const [trackFilter, setTrackFilter] = useState(initialTrack);
  const [detailDay, setDetailDay] = useState<StudentDayAttendance | null>(null);

  const focusDate = weekOf;
  const { workspace, loading, error, refetch } = useAttendanceWorkspace({
    focusDate,
    weekMode: true,
    trackFilter,
  });

  const { data: rosterFacets, isLoading: rosterFacetsLoading } =
    useBobStudentsFacets();
  const trackOptions = useMemo(
    () => rosterTrackFilterOptions(rosterFacets ?? null),
    [rosterFacets],
  );

  const openItems = useMemo(
    () => workspace.discrepancies.filter((d) => d.status === "open"),
    [workspace.discrepancies],
  );

  const resolvedCount = workspace.discrepancies.length - openItems.length;

  function handleViewDetails(item: AttendanceDiscrepancy) {
    const day = workspace.days.find(
      (d) =>
        d.studentId === item.studentId &&
        d.podId === item.podId &&
        d.date === item.date,
    );
    if (day) setDetailDay(day);
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" rounded="lg" />
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
        <Link href="/app/bob/attendance" className="mt-4 inline-block text-sm text-orange-600 hover:underline">
          ← Back to Attendance
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/app/bob/attendance" className="text-sm text-orange-600 hover:underline">
        ← Attendance dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Correction triage
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Youth submit absence and time corrections through One Stop. Review
            open items here, then edit the attendance record in the drawer —
            same fields as Airtable. Missing check-ins are tracked on program
            weekdays only ({PROGRAM_START_DATE} – {PROGRAM_END_DATE}).
          </p>
          {isBeforeProgramStart(new Date().toISOString().slice(0, 10)) ? (
            <p className="text-sm text-amber-800 mt-2">
              Program has not started yet — discrepancy counts will stay at zero
              until Mon {PROGRAM_START_DATE}.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">Week of</label>
          <input
            type="date"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <RosterTrackScopeSelect
            value={trackFilter}
            onChange={setTrackFilter}
            options={trackOptions}
            loading={rosterFacetsLoading}
            emptyLabel="All tracks"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[10rem] max-w-[16rem]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase">Open</p>
          <p className="text-2xl font-bold text-orange-600 tabular-nums">{openItems.length}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase">Resolved</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{resolvedCount}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase">Week range</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {weekOf} → {getWeekSunday(weekOf)}
          </p>
        </div>
      </div>

      <DiscrepancyList
        items={openItems}
        workspace={workspace}
        onViewDetails={handleViewDetails}
      />

      {detailDay ? (
        <StudentDayDrawer
          day={detailDay}
          workspace={workspace}
          onClose={() => setDetailDay(null)}
          onSaved={() => refetch()}
        />
      ) : null}
    </div>
  );
}
