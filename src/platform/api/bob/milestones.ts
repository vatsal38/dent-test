import { apiRequest } from "@/platform/api/client";

export interface BobDeliverableAttachment {
  id: string;
  filename: string;
  url: string;
  type: string | null;
  size?: number | null;
}

export interface BobDeliverableTrackerRecord {
  id: string;
  airtableRecordId: string;
  date: string | null;
  deliverableStatus: string | null;
  reviewStatus: string;
  staffReviewNotes: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  projectDeliverable: string | null;
  amountEarned: number | null;
  uploads: BobDeliverableAttachment[];
  teamAirtableIds?: string[];
  teamNames?: string[];
}

export interface BobDeliverable {
  id: string;
  airtableRecordId: string;
  label: string | null;
  trackName: string | null;
  deliverableNumber: string | null;
  deliverableName: string;
  details: string | null;
  plannedStartDate: string | null;
  targetCompletionDate: string | null;
  milestoneCompletionDate: string | null;
  progressStatus: string | null;
  milestoneComplete: boolean;
  typeOfMilestone: string | null;
  teamAirtableIds: string[];
  teamNames: string[];
  studentAirtableIds: string[];
  projectNames: string[];
  programSemester: string | null;
  staffProgressNotes: string | null;
  finalDeliverableLinks: string | null;
  finalAttachments: BobDeliverableAttachment[];
  trackerRecords: BobDeliverableTrackerRecord[];
  reviewStatus: string;
  createdAt: string | null;
  syncedAt?: string | null;
}

/** @deprecated Use BobDeliverable */
export type BobMilestone = BobDeliverable;

export interface BobMilestonesListParams {
  orgId?: string;
  track?: string;
  deliverableNumber?: string;
  reviewStatus?: string;
  tab?: "pending_review";
}

export interface BobMilestonesListResponse {
  data: BobDeliverable[];
  count: number;
  source?: string;
  syncedAt?: string | null;
  needsImport?: boolean;
}

export async function getBobMilestones(
  params: BobMilestonesListParams,
): Promise<BobMilestonesListResponse> {
  const sp = new URLSearchParams();
  if (params.track) sp.set("track", params.track);
  if (params.deliverableNumber) sp.set("deliverableNumber", params.deliverableNumber);
  if (params.reviewStatus) sp.set("reviewStatus", params.reviewStatus);
  if (params.tab) sp.set("tab", params.tab);
  const qs = sp.toString();
  return apiRequest<BobMilestonesListResponse>(
    `/api/bob/deliverables${qs ? `?${qs}` : ""}`,
  );
}

export async function syncBobDeliverables(): Promise<{
  synced: number;
  trackerCount: number;
}> {
  return apiRequest(`/api/bob/deliverables/sync`, { method: "POST" });
}

export async function getBobMilestone(
  milestoneId: string,
): Promise<BobDeliverable> {
  return apiRequest<BobDeliverable>(
    `/api/bob/deliverables/${milestoneId}`,
  );
}

export async function updateBobMilestone(
  _orgId: string,
  milestoneId: string,
  data: Partial<{
    reviewStatus: string;
    trackerDeliverableStatus: string;
    staffProgressNotes: string;
    staffReviewNotes: string;
    reviewedBy?: string;
    progressStatus: string;
    milestoneComplete: boolean;
    trackerId: string;
    teamName?: string;
    teamAirtableId?: string;
  }>,
): Promise<BobDeliverable> {
  return apiRequest<BobDeliverable>(`/api/bob/deliverables/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
