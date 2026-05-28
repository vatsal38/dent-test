"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteBobStudent,
  getBobRosterSchema,
  getBobStudent,
  getBobStudents,
  getBobStudentsFacets,
  type BobStudentsListParams,
} from "@/platform/api/bob/students";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobStudentsList(
  params: BobStudentsListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: bobKeys.students.list(params),
    queryFn: () => getBobStudents(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useBobStudentsFacets() {
  return useQuery({
    queryKey: bobKeys.students.facets(),
    queryFn: getBobStudentsFacets,
    staleTime: 60_000,
  });
}

export function useBobRosterSchema() {
  return useQuery({
    queryKey: bobKeys.students.schema(),
    queryFn: getBobRosterSchema,
    staleTime: 300_000,
  });
}

export function useBobStudentDetail(id: string | null) {
  return useQuery({
    queryKey: bobKeys.students.detail(id ?? ""),
    queryFn: () => getBobStudent(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useDeleteBobStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBobStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.students.all() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
    },
  });
}
