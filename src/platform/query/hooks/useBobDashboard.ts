"use client";

import { useQuery } from "@tanstack/react-query";
import { getBobDashboard } from "@/platform/api/bob/dashboard";
import { bobKeys } from "@/platform/query/queryKeys";
import { scopeToApiParams } from "@/features/bob/dashboard/scope/resolveScope";
import type { DashboardScope } from "@/features/bob/dashboard/types";

export function useBobDashboard(scope: DashboardScope) {
  const params = scopeToApiParams(scope);
  return useQuery({
    queryKey: bobKeys.dashboard(params),
    queryFn: () => getBobDashboard(params),
    staleTime: 90_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
