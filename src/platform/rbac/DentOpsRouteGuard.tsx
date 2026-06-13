"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBobAccess } from "./useBobAccess";
import { getBobHomeHref } from "./routes";
import { isDentOpsPath } from "./dentOpsRoutes";
import { Skeleton } from "@/components/Skeleton";
import { APP_NAME } from "@/platform/brand";

/**
 * Blocks non-admin users from Dent Ops pages (`/app`, partnerships, inbox, runs).
 * Redirects to the appropriate BoB home for their role.
 */
export function DentOpsRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { access, isPending: bobPending, data: me } = useBobAccess({
    enabled: isAuthenticated && !authLoading,
  });

  const isAdmin = Boolean(user?.isAdmin);
  const dentOpsRoute = isDentOpsPath(pathname);
  const bobReady = me != null || !bobPending;

  const redirectTo = useMemo(() => {
    if (!dentOpsRoute || isAdmin) return null;
    if (!bobReady) return null;
    return getBobHomeHref(access);
  }, [dentOpsRoute, isAdmin, bobReady, access]);

  useEffect(() => {
    if (!redirectTo || authLoading) return;
    router.replace(redirectTo);
  }, [redirectTo, authLoading, router]);

  if (!dentOpsRoute) {
    return <>{children}</>;
  }

  if (authLoading || (!isAdmin && !bobReady)) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Checking access">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (redirectTo) {
    return (
      <div
        className="min-h-[40vh] flex flex-col items-center justify-center gap-2"
        aria-live="polite"
      >
        <p className="text-sm text-gray-600">
          {APP_NAME} partnerships tools are available to platform admins only.
        </p>
        <p className="text-sm text-gray-500">Redirecting to Bet on Baltimore…</p>
      </div>
    );
  }

  return <>{children}</>;
}
