"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createBobAttendance,
  getBobAttendance,
  updateBobAttendance,
  type BobAttendance,
  type BobAttendanceListParams,
  type BobAttendanceStatus,
  type CreateBobAttendanceInput,
} from "@/platform/api/bob/attendance";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobAttendanceList(params: BobAttendanceListParams) {
  return useQuery({
    queryKey: bobKeys.attendance.list(params),
    queryFn: () => getBobAttendance(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateBobAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBobAttendanceInput) => createBobAttendance(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.attendance.all() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
      qc.invalidateQueries({ queryKey: bobKeys.dashboard() });
    },
  });
}

export function useUpdateBobAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: BobAttendanceStatus;
    }) => updateBobAttendance(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.attendance.all() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
      qc.invalidateQueries({ queryKey: bobKeys.dashboard() });
    },
  });
}

/** Optimistic daily status upsert for scan / bulk workflows. */
export function useUpsertBobAttendanceDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBobAttendanceInput) => createBobAttendance(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: bobKeys.attendance.all() });
      const listKey = bobKeys.attendance.list({
        podId: input.podId,
        date: input.date,
        limit: 500,
      });
      const prev = qc.getQueryData<{
        attendance: BobAttendance[];
        total: number;
      }>(listKey);

      const optimistic: BobAttendance = {
        id: `optimistic-${input.studentId}-${input.date}`,
        studentId: input.studentId,
        podId: input.podId,
        date: input.date,
        status: input.status ?? "present",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (prev) {
        const without = prev.attendance.filter(
          (a) =>
            !(
              a.studentId === input.studentId &&
              a.podId === input.podId &&
              a.date === input.date &&
              a.status &&
              !a.signType
            ),
        );
        qc.setQueryData(listKey, {
          ...prev,
          attendance: [...without, optimistic],
        });
      }
      return { listKey, prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev && ctx.listKey) qc.setQueryData(ctx.listKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: bobKeys.attendance.all() });
      qc.invalidateQueries({ queryKey: bobKeys.dashboard() });
    },
  });
}
