import { API_BASE, apiRequest, getIdToken } from "@/platform/api/client";

export const BOB_SUBMISSION_TYPES = [
  "incident",
  "wellness_check",
  "blitz_points",
  "anonymous_feedback",
  "progress_update",
  "parent_contact",
  "pto_request",
  "purchase_request",
  "reimbursement_request",
  "photo_upload",
  "coach_feedback",
  "dent_testimony",
] as const;
export type BobSubmissionType = (typeof BOB_SUBMISSION_TYPES)[number];

export const BOB_SUBMISSION_STATUSES = [
  "new",
  "triaged",
  "in_progress",
  "waiting",
  "done",
  "archived",
] as const;
export type BobSubmissionStatus = (typeof BOB_SUBMISSION_STATUSES)[number];

export const BOB_KANBAN_STATUSES = BOB_SUBMISSION_STATUSES.filter(
  (s) => s !== "archived",
) as Exclude<BobSubmissionStatus, "archived">[];

export interface BobSubmissionAssignee {
  userId: string;
  label: string;
  role: string;
}

export interface BobSubmissionAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size?: number;
  uploadedBy: string | null;
  createdAt: string;
}

export interface BobStatusHistoryEntry {
  from: string | null;
  to: string;
  at: string;
  actorId: string | null;
  source?: string;
}

export interface BobSubmission {
  id: string;
  type: BobSubmissionType;
  status: BobSubmissionStatus;
  priority: string | null;
  studentId: string | null;
  studentIds?: string[];
  student: string | null;
  assignedTo: string | null;
  assignedToLabel: string | null;
  secondaryAssignees?: BobSubmissionAssignee[];
  routingReason?: string | null;
  skipTriage?: boolean;
  incidentType?: string | null;
  severity?: string | null;
  wellnessLevel?: string | null;
  wellnessScore?: number | null;
  wellnessReason?: string | null;
  programWeekIndex?: number | null;
  concernSummary?: string | null;
  description?: string | null;
  team?: string | null;
  points?: number | null;
  reason?: string | null;
  awardedBy?: string | null;
  blitzCategory?: string | null;
  blitzScope?: string | null;
  blitzColor?: string | null;
  blitzTrack?: string | null;
  blitzSource?: string | null;
  blitzAutoKey?: string | null;
  category?: string | null;
  feedback?: string | null;
  milestone?: string | null;
  deliverableId?: string | null;
  deliverableLabel?: string | null;
  deliverableStatus?: string | null;
  reflection?: string | null;
  nextWeekPlan?: string | null;
  proofLinks?: string | null;
  requestStartDate?: string | null;
  requestEndDate?: string | null;
  requestAmount?: number | null;
  requestVendor?: string | null;
  coachRating?: number | null;
  curriculumFeedback?: string | null;
  logisticsFeedback?: string | null;
  openQuestions?: string | null;
  testimonyFormat?: string | null;
  publicConsent?: boolean | null;
  teamName?: string | null;
  notes?: string | null;
  parentName?: string | null;
  parentContacted?: "yes" | "no" | null;
  isAnonymous?: boolean;
  createdByLabel?: string | null;
  resolutionNote?: string | null;
  attachments?: BobSubmissionAttachment[];
  statusHistory?: BobStatusHistoryEntry[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lastTouchedAt: string;
}

export type BobSubmissionEventType =
  | "created"
  | "updated"
  | "comment"
  | "status_change"
  | "assignment"
  | "routing"
  | "notification"
  | "attachment";

export interface BobSubmissionEvent {
  id: string;
  type: BobSubmissionEventType;
  actorId: string | null;
  content: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface BobSubmissionsListParams {
  type?: BobSubmissionType;
  status?: BobSubmissionStatus;
  assignedTo?: string;
  studentId?: string;
  search?: string;
  priority?: string;
  severity?: string;
  excludeArchived?: boolean;
  archivedOnly?: boolean;
  excludeTypes?: BobSubmissionType[];
  limit?: number;
  offset?: number;
}

export interface BobSubmissionNotificationEvent {
  id: string;
  type: string;
  message: string | null;
  submissionId: string | null;
  targetRole: string | null;
  createdAt: string;
}

export interface BobSubmissionNotificationsResponse {
  submissions: BobSubmission[];
  events: BobSubmissionNotificationEvent[];
}

export interface BobSubmissionsListResponse {
  submissions: BobSubmission[];
  total: number;
  limit: number;
  offset: number;
}

export interface BobSubmissionFacets {
  status: Record<string, number>;
  type: Record<string, number>;
  priority: Record<string, number>;
}

export interface BobBulkPatchBody {
  ids: string[];
  status?: BobSubmissionStatus;
  priority?: string | null;
  assignedTo?: string | null;
  assignedToLabel?: string | null;
}

export interface BobBulkPatchResult {
  results: Array<{
    id: string;
    ok: boolean;
    submission?: BobSubmission;
    error?: string;
  }>;
  updated: number;
}

function buildSubmissionsQuery(params?: BobSubmissionsListParams) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set("type", params.type);
  if (params?.status) sp.set("status", params.status);
  if (params?.assignedTo) sp.set("assignedTo", params.assignedTo);
  if (params?.studentId) sp.set("studentId", params.studentId);
  if (params?.search) sp.set("search", params.search);
  if (params?.priority) sp.set("priority", params.priority);
  if (params?.severity) sp.set("severity", params.severity);
  if (params?.excludeArchived) sp.set("excludeArchived", "true");
  if (params?.archivedOnly) sp.set("archivedOnly", "true");
  if (params?.excludeTypes?.length) {
    sp.set("excludeTypes", params.excludeTypes.join(","));
  }
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  return sp.toString();
}

export async function getBobSubmissions(
  params?: BobSubmissionsListParams,
): Promise<BobSubmissionsListResponse> {
  const qs = buildSubmissionsQuery(params);
  return apiRequest<BobSubmissionsListResponse>(
    `/api/bob/submissions${qs ? `?${qs}` : ""}`,
  );
}

export async function getBobSubmissionFacets(
  params?: Pick<
    BobSubmissionsListParams,
    "assignedTo" | "search" | "excludeArchived" | "excludeTypes"
  >,
): Promise<BobSubmissionFacets> {
  const sp = new URLSearchParams();
  if (params?.assignedTo) sp.set("assignedTo", params.assignedTo);
  if (params?.search) sp.set("search", params.search);
  if (params?.excludeArchived) sp.set("excludeArchived", "true");
  if (params?.excludeTypes?.length) {
    sp.set("excludeTypes", params.excludeTypes.join(","));
  }
  const qs = sp.toString();
  return apiRequest<BobSubmissionFacets>(
    `/api/bob/submissions/facets${qs ? `?${qs}` : ""}`,
  );
}

export async function getBobSubmission(id: string): Promise<BobSubmission> {
  return apiRequest<BobSubmission>(`/api/bob/submissions/${id}`);
}

export async function updateBobSubmission(
  id: string,
  data: Partial<
    Pick<
      BobSubmission,
      | "status"
      | "priority"
      | "assignedTo"
      | "assignedToLabel"
      | "resolutionNote"
      | "severity"
    >
  > & { source?: string },
): Promise<BobSubmission> {
  return apiRequest<BobSubmission>(`/api/bob/submissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function bulkUpdateBobSubmissions(
  body: BobBulkPatchBody,
): Promise<BobBulkPatchResult> {
  return apiRequest<BobBulkPatchResult>(`/api/bob/submissions/bulk`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getBobSubmissionEvents(
  id: string,
  limit = 50,
): Promise<{ events: BobSubmissionEvent[] }> {
  return apiRequest<{ events: BobSubmissionEvent[] }>(
    `/api/bob/submissions/${id}/events?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function addBobSubmissionComment(
  id: string,
  content: string,
): Promise<{ success: true }> {
  return apiRequest<{ success: true }>(`/api/bob/submissions/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function addBobSubmissionAttachment(
  id: string,
  data: { filename: string; mimeType: string; content: string },
): Promise<{ success: true; attachment: BobSubmissionAttachment }> {
  return apiRequest<{ success: true; attachment: BobSubmissionAttachment }>(
    `/api/bob/submissions/${id}/attachments`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getBobSubmissionNotifications(params?: {
  limit?: number;
  orgWide?: boolean;
}): Promise<BobSubmissionNotificationsResponse> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.orgWide) sp.set("orgWide", "true");
  const qs = sp.toString();
  return apiRequest<BobSubmissionNotificationsResponse>(
    `/api/bob/submissions/notifications${qs ? `?${qs}` : ""}`,
  );
}

export async function downloadBobSubmissionAttachment(
  submissionId: string,
  attachmentId: string,
): Promise<void> {
  const token = await getIdToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(
    `${API_BASE}/api/bob/submissions/${submissionId}/attachments/${attachmentId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || "attachment";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = decodeURIComponent(filename);
  a.click();
  URL.revokeObjectURL(url);
}
