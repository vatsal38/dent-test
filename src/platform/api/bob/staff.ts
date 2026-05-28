import { apiRequest } from "@/platform/api/client";

export interface BobStaffMember {
  id: string;
  email: string | null;
  name: string | null;
  bobRole: string;
  /** Stored on pod.coachId / pod.siteSupporterId — typically email */
  assignableRef: string;
}

export interface BobStaffListResponse {
  staff: BobStaffMember[];
}

export async function getBobStaff(): Promise<BobStaffListResponse> {
  return apiRequest<BobStaffListResponse>("/api/bob/staff");
}
