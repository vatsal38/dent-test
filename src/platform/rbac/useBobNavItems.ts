"use client";

import { useMemo } from "react";
import { BOB_NAV_CONFIG, type BobNavConfigItem } from "./navConfig";
import { canAccess, resolveBobAccess } from "./resolveBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";

export type BobNavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function orderPrimaryItems(items: BobNavConfigItem[]): BobNavConfigItem[] {
  const ordered: BobNavConfigItem[] = [];
  const remaining = [...items];
  const takeNext = () => {
    if (!remaining.length) return;
    const idx = remaining.findIndex(
      (i) => !i.after || ordered.some((o) => o.href === i.after),
    );
    const pick = idx >= 0 ? idx : 0;
    ordered.push(remaining.splice(pick, 1)[0]);
    takeNext();
  };
  while (remaining.length) takeNext();
  return ordered;
}

export function useBobNavItems(
  icons: Record<BobNavConfigItem["iconKey"], React.ReactNode>,
  options?: { enabled?: boolean },
) {
  const { data: me, isLoading, isPending } = useBobMe({
    enabled: options?.enabled ?? true,
  });
  const navLoading = !me && (isLoading || isPending);
  const access = useMemo(() => resolveBobAccess(me), [me]);

  const { primary, more } = useMemo(() => {
    if (navLoading || !me) {
      return { primary: [] as BobNavItem[], more: [] as BobNavItem[] };
    }
    const allowed = BOB_NAV_CONFIG.filter((item) =>
      canAccess(access, item.permission),
    );
    const toNav = (item: BobNavConfigItem): BobNavItem => ({
      href: item.href,
      label: item.label,
      icon: icons[item.iconKey],
    });
    const primaryItems = orderPrimaryItems(
      allowed.filter((i) => i.section === "primary"),
    );
    const moreItems = allowed.filter((i) => i.section === "more");
    return {
      primary: primaryItems.map(toNav),
      more: moreItems.map(toNav),
    };
  }, [access, icons, me, navLoading]);

  return {
    primary,
    more,
    role: access.role,
    caps: {
      viewProgramReports: canAccess(access, "dashboard.reports"),
      syncAirtable: canAccess(access, "airtable.sync"),
      manageSettings: canAccess(access, "settings.manage"),
      resetPipeline: canAccess(access, "settings.manage"),
      viewAllPods: canAccess(access, "pods.viewAll"),
      viewIntakePipeline: canAccess(access, "intake.view"),
    },
    isLoading: navLoading,
  };
}
