"use client";

import { createContext, useMemo, type ReactNode } from "react";
import { useBobAccess } from "./useBobAccess";
import type { BobAccessContext } from "./types";
import type { BobPermissionId } from "./permissions";
import { canAccess } from "./resolveBobAccess";

export const BobAccessReactContext = createContext<{
  access: BobAccessContext;
  can: (p: BobPermissionId) => boolean;
  isLoading: boolean;
} | null>(null);

export function BobAccessProvider({ children }: { children: ReactNode }) {
  const { access, isLoading, can } = useBobAccess();

  const value = useMemo(
    () => ({
      access,
      can: (p: BobPermissionId) => canAccess(access, p),
      isLoading,
    }),
    [access, isLoading],
  );

  return (
    <BobAccessReactContext.Provider value={value}>
      {children}
    </BobAccessReactContext.Provider>
  );
}
