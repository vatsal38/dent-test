import { apiRequest } from "@/platform/api/client";


export interface BobPod {
  id: string;
  name: string;
  /** Site / location label when synced from Airtable */
  site?: string | null;
  coachId: string | null;
  siteSupporterId: string | null;
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
  coachId?: string | null;
  siteSupporterId?: string | null;
  students?: string[];
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
