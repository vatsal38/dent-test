"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBobProjectTeams,
  getMyBobProjectTeams,
  syncBobProjectTeams,
} from "@/platform/api/bob/projectTeams";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobProjectTeamsList(params?: { track?: string }) {
  return useQuery({
    queryKey: bobKeys.projectTeams.list(params),
    queryFn: () => getBobProjectTeams(params),
  });
}

export function useMyBobProjectTeams(enabled = true) {
  return useQuery({
    queryKey: bobKeys.projectTeams.me(),
    queryFn: () => getMyBobProjectTeams(),
    enabled,
  });
}

export function useSyncBobProjectTeams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: syncBobProjectTeams,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.projectTeams.all() });
    },
  });
}
