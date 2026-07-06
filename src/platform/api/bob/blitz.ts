import { apiRequest } from "@/platform/api/client";

export interface BlitzPointsLogEntry {
  id: string;
  team: string | null;
  points: number;
  reason: string | null;
  category: string | null;
  source: string;
  scope: string | null;
  track: string | null;
  color: string | null;
  awardedBy: string | null;
  createdAt: string | null;
  isRollup: boolean;
}

export async function getBlitzPointsLog(limit = 150): Promise<{
  entries: BlitzPointsLogEntry[];
  total: number;
}> {
  return apiRequest(`/api/bob/blitz/points-log?limit=${limit}`);
}
