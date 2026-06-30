"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getBobWellnessStats,
  getBobWellnessWeek,
  type BobWellnessQueryParams,
} from "@/platform/api/bob/wellness";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobWellnessWeek(
  params?: BobWellnessQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: bobKeys.wellness.week(params),
    queryFn: () => getBobWellnessWeek(params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useBobWellnessStats(
  params?: Pick<BobWellnessQueryParams, "weekIndex" | "track" | "podId">,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: bobKeys.wellness.stats(params),
    queryFn: () => getBobWellnessStats(params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
