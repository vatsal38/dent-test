"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBobPod,
  getBobPod,
  getBobPods,
  updateBobPod,
  type BobPodsListParams,
  type CreateBobPodInput,
} from "@/platform/api/bob/pods";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobPodsList(
  params?: BobPodsListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: bobKeys.pods.list(params ?? {}),
    queryFn: () => getBobPods(params),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useBobPodDetail(id: string | null) {
  return useQuery({
    queryKey: bobKeys.pods.detail(id ?? ""),
    queryFn: () => getBobPod(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBobPod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBobPodInput) => createBobPod(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.pods.all() });
    },
  });
}

export function useUpdateBobPod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateBobPod>[1];
    }) => updateBobPod(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: bobKeys.pods.all() });
      qc.invalidateQueries({ queryKey: bobKeys.pods.detail(id) });
      qc.invalidateQueries({ queryKey: bobKeys.students.all() });
    },
  });
}
