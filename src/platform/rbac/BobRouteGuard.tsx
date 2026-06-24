"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBobAccess } from "./useBobAccess";
import {
  isBobRouteAllowed,
  matchBobRoute,
  resolveBobRouteRedirect,
  resolveStudentProfileRedirect,
} from "./routes";
import { Skeleton } from "@/components/Skeleton";

/**
 * Blocks forbidden BoB pages on direct URL access. Never renders children until allowed.
 */
export function BobRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { can, access, isPending, data: me } = useBobAccess();

  /** Only block on first load — not background refetches (avoids mount/unmount loops). */
  const accessReady = me != null || !isPending;

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

  useEffect(() => {
    if (!redirectTo) return;
    router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!accessReady) {
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
        <p className="text-sm text-gray-600">You don&apos;t have access to this page.</p>
        <p className="text-sm text-gray-500">Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}
