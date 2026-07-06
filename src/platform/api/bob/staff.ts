import { apiRequest } from "@/platform/api/client";

export interface BobStaffTrackRef {
  id: string;
  airtableRecordId: string;
  name: string;
}

export interface BobStaffRosterRow {
  id: string;
  email: string;
  name: string;
  preferredName: string | null;
  dentosRole: string;
  airtableCurrentRoles: string[];
  bobRole: string;
  tracksAsCoach: BobStaffTrackRef[];
  tracksAsSiteSupporter: BobStaffTrackRef[];
  hasAccount: boolean;
  staffSyncedAt: string | null;
}

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

export interface BobStaffRosterResponse {
  staff: BobStaffRosterRow[];
  count: number;
  lastSyncedAt: string | null;
}

export async function getBobStaff(): Promise<BobStaffListResponse> {
  return apiRequest<BobStaffListResponse>("/api/bob/staff");
}

export async function getBobStaffRoster(): Promise<BobStaffRosterResponse> {
  return apiRequest<BobStaffRosterResponse>("/api/bob/staff/roster");
}

export async function syncBobStaffRoster(): Promise<{
  started: boolean;
  synced: number;
  created: number;
  updated: number;
  podsUpdated: number;
  syncedAt: string;
}> {
  return apiRequest("/api/bob/staff/sync-airtable", { method: "POST" });
}
