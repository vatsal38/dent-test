"use client";

import { useMemo } from "react";
import { useBobAttendanceList } from "@/platform/query/hooks/useBobAttendance";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { parseApiError } from "@/platform/api/errors";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { filterPodsByAccess } from "@/platform/rbac/scopedFilters";
import { getWeekMonday, getWeekSunday } from "../weekDates";
import { computeAttendanceWorkspace } from "../model/computeWorkspace";
import { isAirtableSourcedAttendance } from "../model/buildAttendanceIndex";
import {
  ATTENDANCE_FETCH_LIMIT,
  STUDENT_IDS_BATCH_MAX,
  countEnrollment,
} from "../model/scale";

export interface UseAttendanceWorkspaceOptions {
  focusDate: string;
  weekMode?: boolean;
  podFilter?: string;
}

function enrollmentIdsFromPods(
  pods: { id: string; students?: string[] }[],
  podFilter?: string,
): string[] {
  const ids = new Set<string>();
  for (const p of pods) {
    if (podFilter && p.id !== podFilter) continue;
    for (const sid of p.students || []) ids.add(String(sid));
  }
  return Array.from(ids);
}

export function useAttendanceWorkspace({
  focusDate,
  weekMode = false,
  podFilter = "",
}: UseAttendanceWorkspaceOptions) {
  const { access } = useBobAccess();
  // Pod filter is explicit only — do not apply defaultPodId (hides unassigned Airtable rows).
  const effectivePod = podFilter;

  const weekMonday = getWeekMonday(new Date(focusDate + "T12:00:00"));
  const startDate = weekMode ? weekMonday : focusDate;
  const endDate = weekMode ? getWeekSunday(weekMonday) : focusDate;

  const podsQuery = useBobPodsList({ limit: 100 });
  const pods = filterPodsByAccess(podsQuery.data?.pods ?? [], access);

  const enrollmentCount = useMemo(
    () => countEnrollment(pods, effectivePod || undefined),
    [pods, effectivePod],
  );

  const rosterIds = useMemo(
    () => enrollmentIdsFromPods(pods, effectivePod || undefined),
    [pods, effectivePod],
  );

  const attendanceParams = useMemo(
    () => ({
      startDate,
      endDate,
      limit: ATTENDANCE_FETCH_LIMIT,
    }),
    [startDate, endDate],
  );

  const attendanceQuery = useBobAttendanceList(attendanceParams);
  const records = useMemo(
    () =>
      (attendanceQuery.data?.attendance ?? []).filter(isAirtableSourcedAttendance),
    [attendanceQuery.data?.attendance],
  );

  const studentIdsForFetch = useMemo(() => {
    const ids = new Set<string>();
    for (const r of records) {
      if (r.studentId) ids.add(String(r.studentId));
    }
    return Array.from(ids);
  }, [records]);

  const studentListParams = useMemo(() => {
    if (studentIdsForFetch.length === 0) return { limit: 50 as const };
    const batch = studentIdsForFetch.slice(0, STUDENT_IDS_BATCH_MAX);
    return { ids: batch.join(","), limit: batch.length };
  }, [studentIdsForFetch]);

  const studentsQuery = useBobStudentsList(studentListParams);

  const students = studentsQuery.data?.students ?? [];

  const workspace = useMemo(
    () =>
      computeAttendanceWorkspace({
        focusDate,
        startDate: weekMode ? startDate : undefined,
        endDate: weekMode ? endDate : undefined,
        podFilter: effectivePod || undefined,
        pods,
        students,
        records,
        enrollmentCount,
        studentsRequested: rosterIds.length,
      }),
    [
      focusDate,
      weekMode,
      startDate,
      endDate,
      effectivePod,
      pods,
      students,
      records,
      enrollmentCount,
      rosterIds.length,
    ],
  );

  const loading =
    (attendanceQuery.isLoading && !attendanceQuery.data) ||
    podsQuery.isLoading ||
    (studentsQuery.isLoading && !studentsQuery.data);

  const error =
    (attendanceQuery.error && parseApiError(attendanceQuery.error)) ||
    (podsQuery.error && parseApiError(podsQuery.error)) ||
    (studentsQuery.error && parseApiError(studentsQuery.error)) ||
    null;

  const refetch = () => {
    attendanceQuery.refetch();
    podsQuery.refetch();
    studentsQuery.refetch();
  };

  return {
    workspace,
    pods,
    effectivePod,
    enrollmentCount,
    loading,
    error,
    isRefreshing: attendanceQuery.isFetching && !attendanceQuery.isLoading,
    refetch,
    lastSyncedAt: attendanceQuery.dataUpdatedAt
      ? new Date(attendanceQuery.dataUpdatedAt)
      : null,
  };
}
