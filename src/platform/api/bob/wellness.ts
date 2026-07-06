import { apiRequest } from "@/platform/api/client";

export interface BobWellnessWeekInfo {
  weekIndex: number;
  label: string;
  start: string;
  end: string;
}

export interface BobWellnessWeekRow {
  studentId: string;
  studentName: string;
  track: string;
  blitzSquad?: string | null;
  podId: string | null;
  completed: boolean;
  wellnessScore: number | null;
  wellnessReason: string | null;
  submissionId: string | null;
  submittedAt: string | null;
}

export interface BobWellnessBlitzSquadGroup {
  name: string;
  rows: BobWellnessWeekRow[];
  summary: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface BobWellnessWeekResponse {
  week: BobWellnessWeekInfo | null;
  programWeeks: BobWellnessWeekInfo[];
  rows: BobWellnessWeekRow[];
  blitzSquadGroups?: BobWellnessBlitzSquadGroup[];
  summary: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface BobWellnessTrackStat {
  track: string;
  average: number;
  count: number;
}

export interface BobWellnessStatsResponse {
  week: BobWellnessWeekInfo | null;
  overall: number | null;
  overallCount: number;
  byTrack: BobWellnessTrackStat[];
}

export interface BobWellnessQueryParams {
  weekIndex?: number;
  track?: string;
  podId?: string;
  search?: string;
}

function buildWellnessQuery(params?: BobWellnessQueryParams) {
  const sp = new URLSearchParams();
  if (params?.weekIndex != null) sp.set("weekIndex", String(params.weekIndex));
  if (params?.track) sp.set("track", params.track);
  if (params?.podId) sp.set("podId", params.podId);
  if (params?.search) sp.set("search", params.search);
  return sp.toString();
}

export async function getBobWellnessWeek(
  params?: BobWellnessQueryParams,
): Promise<BobWellnessWeekResponse> {
  const qs = buildWellnessQuery(params);
  return apiRequest<BobWellnessWeekResponse>(
    `/api/bob/wellness/week${qs ? `?${qs}` : ""}`,
  );
}

export async function getBobWellnessStats(
  params?: Pick<BobWellnessQueryParams, "weekIndex" | "track" | "podId">,
): Promise<BobWellnessStatsResponse> {
  const sp = new URLSearchParams();
  if (params?.weekIndex != null) sp.set("weekIndex", String(params.weekIndex));
  if (params?.track) sp.set("track", params.track);
  if (params?.podId) sp.set("podId", params.podId);
  const qs = sp.toString();
  return apiRequest<BobWellnessStatsResponse>(
    `/api/bob/wellness/stats${qs ? `?${qs}` : ""}`,
  );
}
