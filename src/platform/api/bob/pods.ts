import { apiRequest } from "@/platform/api/client";
import type { BobImportJobStatus } from "@/platform/api/bob/shared";


export interface BobPod {
  id: string;
  name: string;
  /** Site / location label when synced from Airtable */
  site?: string | null;
  displayLabel?: string | null;
  programYear?: string | null;
  trackRole?: string | null;
  location?: string | null;
  airtableStudentCount?: number | null;
  syncedAt?: string | null;
  airtableRecordId?: string | null;
  coachId: string | null;
  /** Up to two coaches per track (from Airtable Staff links). */
  coachIds?: string[];
  siteSupporterId: string | null;
  staffLabels?: string[];
  students: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BobPodsListParams {
  limit?: number;
  offset?: number;
  /** When true, returns pods where current user can mark attendance (admin: all; site supporter: pods where siteSupporterId === me). */
  canMarkAttendance?: boolean;
}

export interface BobPodsListResponse {
  pods: BobPod[];
  total: number;
  limit: number;
  offset: number;
}

export async function getBobPods(
  params?: BobPodsListParams,
): Promise<BobPodsListResponse> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.canMarkAttendance) sp.set("canMarkAttendance", "1");
  const qs = sp.toString();
  return apiRequest<BobPodsListResponse>(`/api/bob/pods${qs ? `?${qs}` : ""}`);
}

export async function getBobPod(id: string): Promise<BobPod> {
  return apiRequest<BobPod>(`/api/bob/pods/${id}`);
}

export interface CreateBobPodInput {
  name: string;
  site?: string | null;
  trackRole?: string | null;
  program?: string | null;
  location?: string | null;
  coachId?: string | null;
  siteSupporterId?: string | null;
  students?: string[];
}

export interface BobTrackFormOptions {
  programs: string[];
  trackRoles: string[];
  sites: string[];
  defaultProgram: string;
  defaultYearSeasonId: string;
}

export async function getBobTrackFormOptions(): Promise<BobTrackFormOptions> {
  return apiRequest("/api/bob/pods/form-options");
}

export async function createBobPod(data: CreateBobPodInput): Promise<BobPod> {
  return apiRequest<BobPod>("/api/bob/pods", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBobPod(
  id: string,
  data: Partial<CreateBobPodInput> & { students?: string[] },
): Promise<BobPod> {
  return apiRequest<BobPod>(`/api/bob/pods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBobPod(id: string): Promise<{ deleted: true }> {
  return apiRequest<{ deleted: true }>(`/api/bob/pods/${id}`, {
    method: "DELETE",
  });
}

export async function getBobPodsImportSource(): Promise<{
  baseId: string;
  tableId: string;
  viewId: string;
  airtableUrl: string;
}> {
  return apiRequest("/api/bob/pods/import-source");
}

export async function startBobPodsImport(): Promise<{
  started?: boolean;
  synced?: number;
  imported?: number;
  updated?: number;
  removed?: number;
}> {
  return apiRequest("/api/bob/pods/import-airtable", { method: "POST" });
}

export async function getBobPodsImportStatus(): Promise<BobImportJobStatus> {
  return apiRequest<BobImportJobStatus>(
    "/api/bob/pods/import-airtable/status",
  );
}
