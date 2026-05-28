"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getBobMe } from "@/platform/api/bob/me";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobMe(options?: { enabled?: boolean }) {
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const userKey = user?.id ?? firebaseUser?.uid ?? null;
  const enabled =
    (options?.enabled ?? true) && isAuthenticated && Boolean(userKey);

  return useQuery({
    queryKey: bobKeys.me(userKey),
    queryFn: getBobMe,
    enabled,
    staleTime: 60_000,
  });
}
