"use client";

import { useMemo } from "react";
import { useBobAttendanceList } from "@/platform/query/hooks/useBobAttendance";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { parseApiError } from "@/platform/api/errors";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
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

function filterRecordsForStudent<T extends { studentId?: string | null }>(
  rows: T[],
  studentId: string | null,
): T[] {
  if (!studentId) return rows;
  return rows.filter((r) => String(r.studentId || "") === studentId);
}

export function useAttendanceWorkspace({
  focusDate,
  weekMode = false,
  podFilter = "",
  trackFilter = "",
}: UseAttendanceWorkspaceOptions) {
  const { access } = useBobAccess();
  const { data: me } = useBobMe();
  const linkedStudentId = me?.linkedStudent?.id ?? null;
  const isStudentViewer = access.role === "student";
  const effectivePod = isStudentViewer ? "" : podFilter;
  const effectiveTrack = isStudentViewer ? "" : trackFilter;

  const weekMonday = getWeekMonday(new Date(focusDate + "T12:00:00"));
  const startDate = weekMode ? weekMonday : focusDate;
  const endDate = weekMode ? getWeekSunday(weekMonday) : focusDate;

  const podsQuery = useBobPodsList(
    { limit: 100 },
    { enabled: !isStudentViewer },
  );
  const pods = isStudentViewer
    ? []
    : filterPodsByAccess(podsQuery.data?.pods ?? [], access);

  const scopedStudentIds = useMemo((): string[] | null | undefined => {
    if (isStudentViewer) {
      return linkedStudentId ? [linkedStudentId] : [];
    }
    if (!effectivePod) return undefined;
    const pod = pods.find((p) => p.id === effectivePod);
    if (!pod) return null;
    return pod.students ?? [];
  }, [effectivePod, pods, isStudentViewer, linkedStudentId]);

  const studentsQuery = useBobStudentsList(
    {
      bobCohort: effectivePod ? undefined : "active",
      track: effectiveTrack || undefined,
      ids: scopedStudentIds?.length ? scopedStudentIds.join(",") : undefined,
      limit: isStudentViewer ? 1 : scopedStudentIds?.length || 500,
      includeStats: true,
    },
    {
      enabled:
        isStudentViewer
          ? Boolean(linkedStudentId)
          : scopedStudentIds !== null &&
            !(effectivePod && scopedStudentIds?.length === 0),
    },
  );
  const students = studentsQuery.data?.students ?? [];

  const enrollmentCount = useMemo(() => {
    if (isStudentViewer) return students.length;
    if (effectiveTrack) return students.length;
    const fromPods = countEnrollment(pods, effectivePod || undefined);
    if (fromPods > 0) return fromPods;
    return students.length;
  }, [isStudentViewer, effectiveTrack, pods, effectivePod, students.length]);

  const studentAttendanceParams = useMemo(
    () =>
      isStudentViewer && linkedStudentId ? { studentId: linkedStudentId } : {},
    [isStudentViewer, linkedStudentId],
  );

  const attendanceParams = useMemo(
    () => ({
      startDate,
      endDate,
      limit: ATTENDANCE_FETCH_LIMIT,
      ...studentAttendanceParams,
    }),
    [startDate, endDate, studentAttendanceParams],
  );

  const attendanceQuery = useBobAttendanceList(attendanceParams);
  const records = filterRecordsForStudent(
    attendanceQuery.data?.attendance ?? [],
    isStudentViewer ? linkedStudentId : null,
  );

  const weekRollupParams = useMemo(
    () => ({
      startDate: weekMonday,
      endDate: getWeekSunday(weekMonday),
      limit: ATTENDANCE_FETCH_LIMIT,
      ...studentAttendanceParams,
    }),
    [weekMonday, studentAttendanceParams],
  );
  const weekRollupQuery = useBobAttendanceList(weekRollupParams, {
    enabled: !weekMode,
  });
  const weekRecordsForRollup = filterRecordsForStudent(
    weekMode ? records : (weekRollupQuery.data?.attendance ?? []),
    isStudentViewer ? linkedStudentId : null,
  );

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
        studentOnlyId: isStudentViewer ? linkedStudentId : null,
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
      isStudentViewer,
      linkedStudentId,
    ],
  );

  const loading =
    (attendanceQuery.isLoading && !attendanceQuery.data) ||
    (!isStudentViewer && podsQuery.isLoading) ||
    (studentsQuery.isLoading && !studentsQuery.data);

  const error =
    (attendanceQuery.error && parseApiError(attendanceQuery.error)) ||
    (!isStudentViewer && podsQuery.error && parseApiError(podsQuery.error)) ||
    (studentsQuery.error && parseApiError(studentsQuery.error)) ||
    null;

  const refetch = () => {
    attendanceQuery.refetch();
    if (!isStudentViewer) podsQuery.refetch();
    studentsQuery.refetch();
    if (!weekMode) weekRollupQuery.refetch();
  };

  return {
    workspace,
    weekRecordsForRollup,
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
    isStudentViewer,
    linkedStudentId,
  };
}
