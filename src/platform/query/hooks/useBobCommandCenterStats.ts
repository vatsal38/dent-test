"use client";

import { useQuery } from "@tanstack/react-query";
import { getBobCommandCenterStats } from "@/platform/api/bob/stats";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobCommandCenterStats() {
  return useQuery({
    queryKey: bobKeys.stats(),
    queryFn: getBobCommandCenterStats,
    staleTime: 60_000,
  });
}
