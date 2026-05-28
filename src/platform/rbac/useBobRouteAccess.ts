"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useBobAccess } from "./useBobAccess";
import {
  isBobRouteAllowed,
  matchBobRoute,
  resolveBobRouteRedirect,
} from "./routes";

/** URL-level access for the current BoB route (for links, programmatic navigation). */
export function useBobRouteAccess() {
  const pathname = usePathname() ?? "";
  const { can, access, isLoading, isFetching, isPending, data: me } =
    useBobAccess();

  const accessReady = !isLoading && !isFetching && !isPending && me != null;
  const route = matchBobRoute(pathname);
  const allowed = isBobRouteAllowed(pathname, can);
  const redirectTo = useMemo(() => {
    if (!accessReady || allowed) return null;
    return resolveBobRouteRedirect(pathname, can, access);
  }, [accessReady, allowed, pathname, can, access]);

  return {
    pathname,
    route,
    allowed,
    redirectTo,
    accessReady,
    canVisit: (href: string) => isBobRouteAllowed(href, can),
  };
}
