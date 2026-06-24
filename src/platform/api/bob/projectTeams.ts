import { apiRequest } from "@/platform/api/client";

export interface BobProjectTeamMember {
  airtableRecordId: string;
  studentId: string | null;
  name: string;
  track?: string | null;
}

export interface BobProjectTeam {
  id: string;
  airtableRecordId: string;
  name: string;
  trackLabel: string | null;
  memberCount: number;
  members: BobProjectTeamMember[];
  syncedAt?: string | null;
}

export interface BobProjectTeamsListResponse {
  data: BobProjectTeam[];
  count: number;
  syncedAt?: string | null;
  needsSync?: boolean;
}

export async function getBobProjectTeams(params?: {
  track?: string;
}): Promise<BobProjectTeamsListResponse> {
  const sp = new URLSearchParams();
  if (params?.track) sp.set("track", params.track);
  const qs = sp.toString();
  return apiRequest(`/api/bob/project-teams${qs ? `?${qs}` : ""}`);
}

export async function getMyBobProjectTeams(): Promise<BobProjectTeamsListResponse> {
  return apiRequest("/api/bob/project-teams/me");
}

export async function getBobProjectTeam(
  teamId: string,
): Promise<BobProjectTeam> {
  return apiRequest(`/api/bob/project-teams/${teamId}`);
}

export async function syncBobProjectTeams(): Promise<{
  started: boolean;
  synced: number;
  syncedAt: string;
}> {
  return apiRequest("/api/bob/project-teams/sync", { method: "POST" });
}
