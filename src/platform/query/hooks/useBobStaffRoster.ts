"use client";

import { useQuery } from "@tanstack/react-query";
import { getBobStaffRoster } from "@/platform/api/bob/staff";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobStaffRoster() {
  return useQuery({
    queryKey: bobKeys.staff.roster(),
    queryFn: () => getBobStaffRoster(),
    staleTime: 60_000,
  });
}
