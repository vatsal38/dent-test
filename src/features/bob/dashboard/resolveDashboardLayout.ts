import type { DashboardLayoutId } from "./types";
import type { BobOpsRole } from "@/platform/rbac/types";

/** Coaches and support squad get a track-focused home; students get personal dashboard. */
export function resolveDashboardLayoutId(role: BobOpsRole): DashboardLayoutId {
  if (role === "student") return "student_ops";
  if (role === "site_supporter") return "site_supporter_home";
  if (role === "coach") return "coach_home";
  return "command_center";
}
