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
import {
  ATTENDANCE_FETCH_LIMIT,
  countEnrollment,
} from "../model/scale";

export interface UseAttendanceWorkspaceOptions {
  focusDate: string;
  weekMode?: boolean;
  podFilter?: string;
  trackFilter?: string;
}

export function useAttendanceWorkspace({
  focusDate,
  weekMode = false,
  podFilter = "",
  trackFilter = "",
}: UseAttendanceWorkspaceOptions) {
  const { access } = useBobAccess();
  const effectivePod = podFilter;
  const effectiveTrack = trackFilter;

  const weekMonday = getWeekMonday(new Date(focusDate + "T12:00:00"));
  const startDate = weekMode ? weekMonday : focusDate;
  const endDate = weekMode ? getWeekSunday(weekMonday) : focusDate;

  const podsQuery = useBobPodsList({ limit: 100 });
  const pods = filterPodsByAccess(podsQuery.data?.pods ?? [], access);

  const scopedStudentIds = useMemo((): string[] | null | undefined => {
    if (!effectivePod) return undefined;
    const pod = pods.find((p) => p.id === effectivePod);
    if (!pod) return null;
    return pod.students ?? [];
  }, [effectivePod, pods]);

  const studentsQuery = useBobStudentsList(
    {
      bobCohort: effectivePod ? undefined : "active",
      track: effectiveTrack || undefined,
      ids: scopedStudentIds?.length ? scopedStudentIds.join(",") : undefined,
      limit: scopedStudentIds?.length || 500,
      includeStats: false,
    },
    {
      enabled:
        scopedStudentIds !== null &&
        !(effectivePod && scopedStudentIds?.length === 0),
    },
  );
  const students = studentsQuery.data?.students ?? [];

  const enrollmentCount = useMemo(() => {
    if (effectiveTrack) return students.length;
    const fromPods = countEnrollment(pods, effectivePod || undefined);
    if (fromPods > 0) return fromPods;
    return students.length;
  }, [pods, effectivePod, effectiveTrack, students.length]);

  const attendanceParams = useMemo(
    () => ({
      startDate,
      endDate,
      limit: ATTENDANCE_FETCH_LIMIT,
    }),
    [startDate, endDate],
  );

  const attendanceQuery = useBobAttendanceList(attendanceParams);
  const records = attendanceQuery.data?.attendance ?? [];

  const workspace = useMemo(
    () =>
      computeAttendanceWorkspace({
        focusDate,
        startDate: weekMode ? startDate : undefined,
        endDate: weekMode ? endDate : undefined,
        podFilter: effectivePod || undefined,
        trackFilter: effectiveTrack || undefined,
        pods,
        students,
        records,
        enrollmentCount,
        studentsRequested: students.length,
      }),
    [
      focusDate,
      weekMode,
      startDate,
      endDate,
      effectivePod,
      effectiveTrack,
      pods,
      students,
      records,
      enrollmentCount,
      students.length,
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
