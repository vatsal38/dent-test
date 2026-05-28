"use client";

import { useCallback, useMemo } from "react";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import {
  canAccess,
  canAccessAll,
  canAccessAny,
  resolveBobAccess,
} from "./resolveBobAccess";
import { bobCapabilitiesFromMe } from "./bobCapabilities";
import type { BobPermissionId } from "./permissions";
import type { BobAccessContext } from "./types";
import { defaultPodFilter, siteFilterOptions } from "./scopedFilters";

export function useBobAccess(options?: { enabled?: boolean }) {
  const query = useBobMe({ enabled: options?.enabled ?? true });

  const access = useMemo(
    () => resolveBobAccess(query.data),
    [query.data],
  );

  const caps = useMemo(
    () => bobCapabilitiesFromMe(query.data),
    [query.data],
  );

  const can = useCallback(
    (permission: BobPermissionId) => canAccess(access, permission),
    [access],
  );
  const canAny = useCallback(
    (permissions: BobPermissionId[]) => canAccessAny(access, permissions),
    [access],
  );
  const canAll = useCallback(
    (permissions: BobPermissionId[]) => canAccessAll(access, permissions),
    [access],
  );

  return {
    ...query,
    access,
    caps,
    role: access.role,
    scopeType: access.scopeType,
    isScoped: access.isScoped,
    primaryPod: access.primaryPod,
    podIds: access.podIds,
    siteNames: access.siteNames,
    defaultPodId: defaultPodFilter(access),
    siteFilterOptions: siteFilterOptions(access),
    can,
    canAny,
    canAll,
  };
}

export type UseBobAccessResult = ReturnType<typeof useBobAccess>;
