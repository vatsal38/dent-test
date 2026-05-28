"use client";

import { useMemo } from "react";
import { useBobAccess } from "./useBobAccess";
import { filterPodsByAccess, filterStudentsByAccess } from "./scopedFilters";

/**
 * Scoped list helpers for React Query hooks — applies client filters when
 * the API returns broader data (defense in depth; backend still scopes session).
 */
export function useBobScopedListParams() {
  const { access, defaultPodId, siteFilterOptions } = useBobAccess();

  return useMemo(
    () => ({
      access,
      defaultPodId,
      siteFilterOptions,
      filterPods: <T extends { id: string; site?: string | null }>(pods: T[]) =>
        filterPodsByAccess(pods, access),
      filterStudents: <
        T extends { id: string; podId?: string | null; site?: string | null },
      >(
        students: T[],
      ) => filterStudentsByAccess(students, access),
      /** Suggested default filters for attendance / roster UIs */
      listDefaults: {
        podId: defaultPodId || undefined,
        site: siteFilterOptions[0] || undefined,
      },
    }),
    [access, defaultPodId, siteFilterOptions],
  );
}
