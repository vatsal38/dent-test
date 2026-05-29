import { apiRequest } from "@/platform/api/client";

export interface BobAirtableStatus {
  connected: boolean;
  baseId: string | null;
  running: boolean;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: { message?: string; at?: string } | null;
  progress: {
    phase?: string;
    message?: string;
    [key: string]: unknown;
  } | null;
  heartbeatAt: string | null;
  access?: { ok: boolean | null; error?: string } | null;
}

export async function getBobAirtableStatus(): Promise<BobAirtableStatus> {
  return apiRequest<BobAirtableStatus>("/api/bob/airtable/status");
}

export async function syncBobAirtable(): Promise<{
  started?: boolean;
  message?: string;
  [key: string]: unknown;
}> {
  return apiRequest("/api/bob/airtable/sync", { method: "POST" });
}

export async function syncBobAttendanceAirtable(): Promise<{
  started?: boolean;
  message?: string;
  [key: string]: unknown;
}> {
  return apiRequest("/api/bob/attendance/sync-airtable", { method: "POST" });
}

export async function resolveBobAirtableRecordLabels(params: {
  tableId: string;
  recordIds: string[];
}): Promise<{ tableId: string; labels: Record<string, string | null> }> {
  const sp = new URLSearchParams();
  sp.set("tableId", params.tableId);
  for (const id of params.recordIds || []) sp.append("recordIds", id);
  return apiRequest<{ tableId: string; labels: Record<string, string | null> }>(
    `/api/bob/airtable/resolve-record-labels?${sp.toString()}`,
  );
}
