"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  approveBobRecruitment,
  deleteBobRecruitment,
  getBobRecruitmentFacets,
  getBobRecruitmentList,
  getBobRecruitmentRecord,
  getBobRecruitmentSchema,
  getBobRecruitmentTransferableIds,
  type BobRecruitmentListParams,
} from "@/platform/api/bob/recruitment";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobRecruitmentList(params: BobRecruitmentListParams) {
  return useQuery({
    queryKey: bobKeys.recruitment.list(params),
    queryFn: () => getBobRecruitmentList(params),
    placeholderData: keepPreviousData,
  });
}

export function useBobRecruitmentFacets() {
  return useQuery({
    queryKey: bobKeys.recruitment.facets(),
    queryFn: getBobRecruitmentFacets,
    staleTime: 60_000,
  });
}

export function useBobRecruitmentTransferableIds(
  params: BobRecruitmentListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: bobKeys.recruitment.transferableIds(params),
    queryFn: () => getBobRecruitmentTransferableIds(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useBobRecruitmentSchema() {
  return useQuery({
    queryKey: bobKeys.recruitment.schema(),
    queryFn: getBobRecruitmentSchema,
    staleTime: 300_000,
  });
}

export function useBobRecruitmentDetail(id: string | null) {
  return useQuery({
    queryKey: bobKeys.recruitment.detail(id ?? ""),
    queryFn: () => getBobRecruitmentRecord(id!),
    enabled: Boolean(id),
  });
}

export function useDeleteBobRecruitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBobRecruitment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.recruitment.all() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
    },
  });
}

export function useApproveBobRecruitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveBobRecruitment(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: bobKeys.recruitment.detail(id) });
      qc.invalidateQueries({ queryKey: bobKeys.recruitment.all() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
    },
  });
}
