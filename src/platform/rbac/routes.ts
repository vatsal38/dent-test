import type { BobPermissionId } from "./permissions";
import { canAccess } from "./resolveBobAccess";
import type { BobAccessContext } from "./types";

export type BobRouteDef = {
  /** Path prefix matched with `startsWith` */
  path: string;
  permission: BobPermissionId;
  /** Redirect when denied */
  fallback?: string;
};

/**
 * BoB route → minimum permission. Most specific paths first.
 * Checked by {@link BobRouteGuard} — blocks render + redirects on direct URL access.
 */
export const BOB_ROUTES: BobRouteDef[] = [
  { path: "/app/bob/key-links", permission: "keyLinks.view", fallback: "/app/bob" },
  { path: "/app/bob/teams", permission: "teams.view", fallback: "/app/bob" },
  { path: "/app/bob/settings", permission: "settings.view", fallback: "/app/bob" },
  { path: "/app/bob/staff", permission: "staff.view", fallback: "/app/bob" },
  {
    path: "/app/bob/recruitment/new",
    permission: "intake.edit",
    fallback: "/app/bob/recruitment",
  },
  {
    path: "/app/bob/recruitment",
    permission: "intake.view",
    fallback: "/app/bob/roster",
  },
  {
    path: "/app/bob/roster/new",
    permission: "roster.create",
    fallback: "/app/bob/roster",
  },
  { path: "/app/bob/roster", permission: "roster.view" },
  { path: "/app/bob/pods/new", permission: "pods.create", fallback: "/app/bob/pods" },
  { path: "/app/bob/pods", permission: "pods.view", fallback: "/app/bob/my-pod" },
  { path: "/app/bob/my-pod", permission: "myPod.view", fallback: "/app/bob" },
  {
    path: "/app/bob/attendance/mark",
    permission: "attendance.mark",
    fallback: "/app/bob/attendance",
  },
  {
    path: "/app/bob/attendance/discrepancies",
    permission: "attendance.discrepancies",
    fallback: "/app/bob/attendance",
  },
  {
    path: "/app/bob/attendance/correction",
    permission: "attendance.discrepancies",
    fallback: "/app/bob/attendance/discrepancies",
  },
  {
    path: "/app/bob/attendance",
    permission: "attendance.view",
    fallback: "/app/bob/roster",
  },
  { path: "/app/bob/deliverables", permission: "milestones.view" },
  { path: "/app/bob/milestones", permission: "milestones.view", fallback: "/app/bob/deliverables" },
  { path: "/app/bob/inbox", permission: "inbox.view" },
  { path: "/app/bob/workflow", permission: "inbox.view" },
  { path: "/app/bob/interview", permission: "roster.view" },
  { path: "/app/bob/submit", permission: "submit.view" },
  { path: "/app/bob/home", permission: "submit.view" },
  { path: "/app/bob/reports", permission: "dashboard.reports", fallback: "/app/bob" },
  { path: "/app/bob", permission: "dashboard.view" },
];

export function matchBobRoute(pathname: string): BobRouteDef | null {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
  for (const route of BOB_ROUTES) {
    const base = route.path.replace(/\/$/, "") || route.path;
    if (
      normalized === base ||
      (base !== "/app/bob" && normalized.startsWith(`${base}/`))
    ) {
      return route;
    }
  }
  if (normalized.startsWith("/app/bob")) {
    return { path: "/app/bob", permission: "dashboard.view" };
  }
  return null;
}

/** First allowed landing page for this access context (used when URL is forbidden). */
export function getBobHomeHref(access: BobAccessContext): string {
  if (access.role === "student" && canAccess(access, "dashboard.view")) {
    return "/app/bob";
  }
  if (access.role === "student" && canAccess(access, "submit.view")) {
    return "/app/bob/home";
  }
  if (canAccess(access, "myPod.view") && access.primaryPod) {
    return "/app/bob/my-pod";
  }
  if (canAccess(access, "dashboard.view")) {
    return "/app/bob";
  }
  if (canAccess(access, "attendance.view")) {
    return "/app/bob/attendance";
  }
  if (canAccess(access, "roster.view")) {
    return "/app/bob/roster";
  }
  if (canAccess(access, "inbox.view")) {
    return "/app/bob/inbox";
  }
  return "/app";
}

export function resolveBobRouteRedirect(
  pathname: string,
  can: (permission: BobPermissionId) => boolean,
  access: BobAccessContext,
): string | null {
  const route = matchBobRoute(pathname);
  if (!route) return null;
  if (can(route.permission)) return null;
  return route.fallback ?? getBobHomeHref(access);
}

export function isBobRouteAllowed(
  pathname: string,
  can: (permission: BobPermissionId) => boolean,
): boolean {
  const route = matchBobRoute(pathname);
  if (!route) return true;
  return can(route.permission);
}
