"use client";

import type { ReactNode } from "react";
import { useBobAccess } from "./useBobAccess";
import type { BobPermissionId } from "./permissions";
import { UnauthorizedState } from "./UnauthorizedState";

type BobPermissionGuardProps = {
  permission: BobPermissionId | BobPermissionId[];
  mode?: "any" | "all";
  children: ReactNode;
  fallback?: ReactNode;
  /** When true, render nothing instead of unauthorized UI */
  silent?: boolean;
};

/**
 * Declarative permission gate for actions, drawers, widgets, and sections.
 *
 * @example
 * <BobPermissionGuard permission="pods.create">
 *   <CreatePodButton />
 * </BobPermissionGuard>
 */
export function BobPermissionGuard({
  permission,
  mode = "any",
  children,
  fallback,
  silent = false,
}: BobPermissionGuardProps) {
  const { can, canAny, canAll, isLoading } = useBobAccess();

  if (isLoading) return null;

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed =
    perms.length === 1
      ? can(perms[0])
      : mode === "all"
        ? canAll(perms)
        : canAny(perms);

  if (allowed) return <>{children}</>;
  if (silent) return null;
  if (fallback !== undefined) return <>{fallback}</>;
  return <UnauthorizedState compact />;
}
