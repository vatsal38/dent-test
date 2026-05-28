"use client";

import { useMemo } from "react";
import { DASHBOARD_LAYOUTS } from "../config/layouts";
import { widgetVisible } from "../config/widgets";
import type { DashboardLayoutId, WidgetPlacement } from "../types";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import type { DashboardScopeLevel } from "../types";

export function useDashboardLayout(
  layoutId: DashboardLayoutId,
  scopeLevel: DashboardScopeLevel,
) {
  const { can, role } = useBobAccess();

  return useMemo(() => {
    const layout = DASHBOARD_LAYOUTS[layoutId];
    const sections = layout.sections
      .map((section) => ({
        ...section,
        widgets: section.widgets.filter((w) =>
          widgetVisible(w, { can, role, scopeLevel }),
        ),
      }))
      .filter((s) => s.widgets.length > 0);
    return { layout, sections };
  }, [layoutId, scopeLevel, can, role]);
}

export function colSpanClass(colSpan?: WidgetPlacement["colSpan"]): string {
  switch (colSpan) {
    case 12:
      return "lg:col-span-12";
    case 8:
      return "lg:col-span-8";
    case 6:
      return "lg:col-span-6";
    case 4:
      return "lg:col-span-4";
    case 3:
      return "lg:col-span-3";
    case 2:
      return "lg:col-span-2";
    case 1:
      return "lg:col-span-1";
    default:
      return "lg:col-span-6";
  }
}
