"use client";

import { useMemo } from "react";
import { useBobAttendanceList } from "@/platform/query/hooks/useBobAttendance";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { parseApiError } from "@/platform/api/errors";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { filterPodsByAccess } from "@/platform/rbac/scopedFilters";
import { PROGRAM_START_DATE } from "@/lib/bobProgramCalendar";
import { getWeekMonday, getWeekSunday } from "../weekDates";
import { computeAttendanceWorkspace } from "../model/computeWorkspace";
import { filterStudentsByCoachAttendanceScope } from "../model/coachAttendanceScope";
import {
  ATTENDANCE_FETCH_LIMIT,
  ATTENDANCE_WEEK_FETCH_LIMIT,
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
  const scopedStudents = useMemo(
    () =>
      isStudentViewer
        ? students
        : filterStudentsByCoachAttendanceScope(students, access, pods),
    [students, access, pods, isStudentViewer],
  );

  const enrollmentCount = useMemo(() => {
    if (isStudentViewer) return scopedStudents.length;
    if (effectiveTrack) return scopedStudents.length;
    const fromPods = countEnrollment(pods, effectivePod || undefined);
    if (fromPods > 0) return fromPods;
    return scopedStudents.length;
  }, [isStudentViewer, effectiveTrack, pods, effectivePod, scopedStudents.length]);

  const studentAttendanceParams = useMemo(
    () =>
      isStudentViewer && linkedStudentId ? { studentId: linkedStudentId } : {},
    [isStudentViewer, linkedStudentId],
  );

  const attendanceFetchLimit = weekMode
    ? ATTENDANCE_WEEK_FETCH_LIMIT
    : ATTENDANCE_FETCH_LIMIT;

  const attendanceParams = useMemo(
    () => ({
      startDate,
      endDate,
      limit: attendanceFetchLimit,
      ...studentAttendanceParams,
    }),
    [startDate, endDate, studentAttendanceParams, attendanceFetchLimit],
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
      limit: ATTENDANCE_WEEK_FETCH_LIMIT,
      ...studentAttendanceParams,
    }),
    [weekMonday, studentAttendanceParams],
  );
  const weekRollupQuery = useBobAttendanceList(weekRollupParams, {
    enabled: !weekMode && !isStudentViewer,
  });
  const weekRecordsForRollup = filterRecordsForStudent(
    weekMode ? records : (weekRollupQuery.data?.attendance ?? []),
    isStudentViewer ? linkedStudentId : null,
  );

  const programRollupParams = useMemo(
    () => ({
      startDate: PROGRAM_START_DATE,
      endDate: focusDate,
      limit: ATTENDANCE_WEEK_FETCH_LIMIT,
      ...studentAttendanceParams,
    }),
    [focusDate, studentAttendanceParams],
  );
  const programRollupQuery = useBobAttendanceList(programRollupParams, {
    enabled: !isStudentViewer,
  });
  const programRecordsForRollup = filterRecordsForStudent(
    programRollupQuery.data?.attendance ?? [],
    isStudentViewer ? linkedStudentId : null,
  );

  const weekRollupWorkspace = useMemo(
    () =>
      computeAttendanceWorkspace({
        focusDate: getWeekSunday(weekMonday),
        startDate: weekMonday,
        endDate: getWeekSunday(weekMonday),
        podFilter: effectivePod || undefined,
        trackFilter: effectiveTrack || undefined,
        pods,
        students: scopedStudents,
        records: weekRecordsForRollup,
        enrollmentCount,
        studentsRequested: scopedStudents.length,
        studentOnlyId: isStudentViewer ? linkedStudentId : null,
      }),
    [
      weekMonday,
      effectivePod,
      effectiveTrack,
      pods,
      scopedStudents,
      weekRecordsForRollup,
      enrollmentCount,
      isStudentViewer,
      linkedStudentId,
    ],
  );

  const programRollupWorkspace = useMemo(
    () =>
      computeAttendanceWorkspace({
        focusDate,
        startDate: PROGRAM_START_DATE,
        endDate: focusDate,
        podFilter: effectivePod || undefined,
        trackFilter: effectiveTrack || undefined,
        pods,
        students: scopedStudents,
        records: programRecordsForRollup,
        enrollmentCount,
        studentsRequested: scopedStudents.length,
        studentOnlyId: isStudentViewer ? linkedStudentId : null,
      }),
    [
      focusDate,
      effectivePod,
      effectiveTrack,
      pods,
      scopedStudents,
      programRecordsForRollup,
      enrollmentCount,
      isStudentViewer,
      linkedStudentId,
    ],
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
        students: scopedStudents,
        records,
        enrollmentCount,
        studentsRequested: scopedStudents.length,
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
      scopedStudents,
      records,
      enrollmentCount,
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
    weekDaysForRollup: weekRollupWorkspace.days,
    programDaysForRollup: programRollupWorkspace.days,
    weekRecordsForRollup,
    programRecordsForRollup,
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
