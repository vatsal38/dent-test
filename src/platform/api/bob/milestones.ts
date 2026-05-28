import { apiRequest } from "@/platform/api/client";


export interface BobMilestone {
  id: string;
  projectId: string;
  orgSlug: string;
  scopeId: string | null;
  name: string;
  scopeArea: string;
  phase: string | null;
  targetDate: string;
  targetEndDate: string;
  contractualDate: string | null;
  projectedEndDate: string | null;
  actualDate: string | null;
  actualEndDate: string | null;
  status: string;
  owner: string;
  ownerId: string | null;
  ownerName: string;
  ownerRole: string | null;
  gcTrackingNumber: number | null;
  lookaheadItemCount: number;
  lookaheadBlockedCount: number;
  materialBlockedCount: number;
  predecessors: string[];
  successors: string[];
  durationDays: number;
  isCriticalPath: boolean;
  floatDays: number | null;
  notes: string | null;
  reviewStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BobMilestonesListParams {
  orgId: string;
  status?: string;
  projectId?: string;
  phase?: string;
  reviewStatus?: string;
  tab?: "pending_review";
}

export interface BobMilestonesListResponse {
  data: BobMilestone[];
  count: number;
}

export async function getBobMilestones(
  params: BobMilestonesListParams,
): Promise<BobMilestonesListResponse> {
  const sp = new URLSearchParams();
  sp.set("orgId", params.orgId);
  if (params.status) sp.set("status", params.status);
  if (params.projectId) sp.set("projectId", params.projectId);
  if (params.phase) sp.set("phase", params.phase);
  if (params.reviewStatus) sp.set("reviewStatus", params.reviewStatus);
  if (params.tab) sp.set("tab", params.tab);
  return apiRequest<BobMilestonesListResponse>(
    `/api/bob/milestones?${sp.toString()}`,
  );
}

export async function getBobMilestone(
  orgId: string,
  milestoneId: string,
): Promise<BobMilestone> {
  return apiRequest<BobMilestone>(
    `/api/bob/milestones/${milestoneId}?orgId=${encodeURIComponent(orgId)}`,
  );
}

export async function updateBobMilestone(
  orgId: string,
  milestoneId: string,
  data: Partial<Pick<BobMilestone, "reviewStatus" | "status" | "notes">>,
): Promise<BobMilestone> {
  return apiRequest<BobMilestone>(`/api/bob/milestones/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, orgId }),
  });
}
