/**
 * Dent Ops (non-BoB) routes — platform admin only.
 * BoB lives under `/app/bob/*` and uses {@link ./routes.ts}.
 */

export const DENT_OPS_ROUTES = [
  { path: "/app/partnerships", label: "Partnerships" },
  { path: "/app/inbox", label: "Email" },
  { path: "/app/runs", label: "Runs" },
  { path: "/app", label: "Home" },
] as const;

/** True for `/app/*` paths outside Bet on Baltimore. */
export function isDentOpsPath(pathname: string): boolean {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (!normalized.startsWith("/app")) return false;
  if (normalized === "/app/bob" || normalized.startsWith("/app/bob/")) {
    return false;
  }
  return true;
}

export function matchDentOpsRoute(pathname: string): (typeof DENT_OPS_ROUTES)[number] | null {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
  for (const route of DENT_OPS_ROUTES) {
    const base = route.path;
    if (
      normalized === base ||
      (base !== "/app" && normalized.startsWith(`${base}/`))
    ) {
      return route;
    }
  }
  if (isDentOpsPath(normalized)) {
    return { path: "/app", label: "Home" };
  }
  return null;
}

export function canAccessDentOps(isAdmin: boolean): boolean {
  return isAdmin;
}
