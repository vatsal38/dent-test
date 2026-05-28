import type { BobOpsRole } from "@/platform/rbac/types";
import type { BobPermissionId } from "@/platform/rbac/permissions";
import type { WidgetPlacement, DashboardScopeLevel } from "../types";
import { scopeLevelRank } from "../scope/resolveScope";

export function widgetVisible(
  placement: WidgetPlacement,
  ctx: {
    can: (p: BobPermissionId) => boolean;
    role: BobOpsRole;
    scopeLevel: DashboardScopeLevel;
  },
): boolean {
  if (placement.permissions?.length) {
    const ok = placement.permissions.some((p) => ctx.can(p));
    if (!ok) return false;
  }
  if (placement.roles?.length && !placement.roles.includes(ctx.role)) {
    return false;
  }
  if (placement.minScope) {
    if (scopeLevelRank(ctx.scopeLevel) < scopeLevelRank(placement.minScope)) {
      return false;
    }
  }
  return true;
}
