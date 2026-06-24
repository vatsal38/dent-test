"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useBobAccess } from "./useBobAccess";
import {
  isBobRouteAllowed,
  matchBobRoute,
  resolveBobRouteRedirect,
  resolveStudentProfileRedirect,
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
    if (!accessReady) return null;
    const profileRedirect = resolveStudentProfileRedirect(
      pathname,
      access,
      me?.linkedStudent?.id,
    );
    if (profileRedirect) return profileRedirect;
    if (allowed) return null;
    return resolveBobRouteRedirect(pathname, can, access, me);
  }, [accessReady, allowed, pathname, can, access, me]);

  return {
    pathname,
    route,
    allowed,
    redirectTo,
    accessReady,
    canVisit: (href: string) => isBobRouteAllowed(href, can),
  };
}
