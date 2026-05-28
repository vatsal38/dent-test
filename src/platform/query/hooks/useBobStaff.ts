"use client";

import { useQuery } from "@tanstack/react-query";
import { getBobStaff } from "@/platform/api/bob/staff";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobStaffList() {
  return useQuery({
    queryKey: bobKeys.staff.list(),
    queryFn: () => getBobStaff(),
    staleTime: 60_000,
  });
}
