import type { BobRole } from "@/platform/api/bob/me";
import type { BobOpsRole } from "./types";
import { BOB_SITE_SUPPORTER } from "@/lib/bobDisplayTerminology";

export function bobRoleLabel(role: BobOpsRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "program_manager":
      return "Program Manager";
    case "site_supporter":
      return BOB_SITE_SUPPORTER;
    case "coach":
      return "Coach";
    case "student":
      return "Student";
    default:
      return "Staff";
  }
}

/** Map API `role` or legacy `bobRole` to canonical ops role. */
export function normalizeBobOpsRole(me: {
  role?: string | null;
  bobRole?: BobRole | null;
} | null | undefined): BobOpsRole {
  const canonical = me?.role;
  if (
    canonical === "admin" ||
    canonical === "program_manager" ||
    canonical === "site_supporter" ||
    canonical === "coach" ||
    canonical === "student" ||
    canonical === "read_only"
  ) {
    return canonical;
  }
  switch (me?.bobRole) {
    case "program_director":
      return "admin";
    case "recruitment_ops":
      return "program_manager";
    case "site_coach":
      return "coach";
    case "read_only":
      return "read_only";
    default:
      return "program_manager";
  }
}

export function coachHomeHref(primaryPodId: string | null | undefined) {
  return primaryPodId ? `/app/bob/my-pod` : "/app/bob/roster";
}
