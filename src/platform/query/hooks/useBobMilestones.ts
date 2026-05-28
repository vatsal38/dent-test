"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBobMilestones,
  updateBobMilestone,
  type BobMilestonesListParams,
} from "@/platform/api/bob/milestones";
import { bobKeys } from "@/platform/query/queryKeys";

export const BOB_MILESTONES_ORG_ID = "bob";

export function useBobMilestonesList(params: BobMilestonesListParams) {
  return useQuery({
    queryKey: bobKeys.milestones.list(params),
    queryFn: () => getBobMilestones(params),
  });
}

export function useUpdateBobMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orgId,
      milestoneId,
      data,
    }: {
      orgId: string;
      milestoneId: string;
      data: Parameters<typeof updateBobMilestone>[2];
    }) => updateBobMilestone(orgId, milestoneId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.milestones.all() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
    },
  });
}
