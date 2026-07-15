import { apiRequest } from "@/platform/api/client";
import type { BobOpsRole, BobScopeType } from "@/platform/rbac/types";

/** @deprecated Use {@link BobOpsRole} — legacy API values */
export type BobRole =
  | "program_director"
  | "site_coach"
  | "recruitment_ops"
  | "fellow"
  | "read_only";

export interface BobMeResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
  } | null;
  demoScope?: {
    studentId?: string;
    studentName?: string;
    podName?: string;
    siteNames?: string[];
  } | null;
  /** Roster student linked to this youth account */
  linkedStudent?: {
    id: string;
    name: string | null;
    firstName?: string | null;
    lastName?: string | null;
    preferredName?: string | null;
    podId: string | null;
    track: string | null;
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
  assignedPods: { id: string; name: string; site: string | null }[];
}

export async function getBobMe(): Promise<BobMeResponse> {
  return apiRequest<BobMeResponse>("/api/bob/me");
}
