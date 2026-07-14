import type { BobMeResponse } from "@/platform/api/bob/me";

/** Canonical BoB operations roles. */
export type BobOpsRole =
  | "admin"
  | "program_manager"
  | "site_supporter"
  | "coach"
  | "summer_staff"
  | "student"
  | "read_only";

/** Data visibility boundary for the signed-in user. */
export type BobScopeType = "organization" | "site" | "pod";

/**
 * Resolved access context — single source for guards, nav, and scoped queries.
 * Built from `GET /api/bob/me` via {@link resolveBobAccess}.
 */
export interface BobAccessContext {
  role: BobOpsRole;
  /** @deprecated Prefer `role`; kept for gradual migration */
  legacyBobRole: BobMeResponse["bobRole"];
  scopeType: BobScopeType;
  isScoped: boolean;
  identifiers: string[];
  podIds: string[];
  siteNames: string[];
  primaryPod: BobMeResponse["primaryPod"];
  user: BobMeResponse["user"];
}

export type { BobPermissionId as BobPermission } from "./permissions";
