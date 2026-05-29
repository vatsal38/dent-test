import { apiRequest } from "@/platform/api/client";
import type { BobImportJobStatus } from "@/platform/api/bob/shared";

export async function startBobAttendanceImport(): Promise<{
  started: boolean;
  startedAt?: string;
  pollPath?: string;
}> {
  return apiRequest("/api/bob/attendance/import-airtable", { method: "POST" });
}

export async function getBobAttendanceImportStatus(): Promise<BobImportJobStatus> {
  return apiRequest<BobImportJobStatus>(
    "/api/bob/attendance/import-airtable/status",
  );
}

