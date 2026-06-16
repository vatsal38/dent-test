import type { DashboardLayoutId } from "./types";
import type { BobOpsRole } from "@/platform/rbac/types";

/** Coaches and track supporters get a track-focused home; leadership sees org command center. */
export function resolveDashboardLayoutId(role: BobOpsRole): DashboardLayoutId {
  if (role === "coach" || role === "site_supporter") return "coach_home";
  return "command_center";
}
