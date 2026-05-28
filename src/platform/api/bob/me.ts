import { apiRequest } from "@/platform/api/client";
import type { BobOpsRole, BobScopeType } from "@/platform/rbac/types";

/** @deprecated Use {@link BobOpsRole} — legacy API values */
export type BobRole =
  | "program_director"
  | "site_coach"
  | "recruitment_ops"
  | "read_only";

export interface BobMeResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
  } | null;
  /** Canonical role for RBAC */
  role: BobOpsRole;
  scopeType: BobScopeType;
  podIds: string[];
  siteNames: string[];
  /** Legacy role string; mirrors pre-RBAC clients */
  bobRole: BobRole;
  coachScope: boolean;
  coachIdentifiers: string[];
  primaryPod: { id: string; name: string } | null;
}

export async function getBobMe(): Promise<BobMeResponse> {
  return apiRequest<BobMeResponse>("/api/bob/me");
}
