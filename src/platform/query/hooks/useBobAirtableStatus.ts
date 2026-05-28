"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBobAirtableStatus,
  syncBobAirtable,
} from "@/platform/api/bob/airtable";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobAirtableStatus() {
  return useQuery({
    queryKey: bobKeys.airtable.status(),
    queryFn: getBobAirtableStatus,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.running) return 3_000;
      return 60_000;
    },
  });
}

export function useBobAirtableSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: syncBobAirtable,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.airtable.status() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
    },
  });
}
