import { apiRequest } from "@/platform/api/client";
import type { BobImportJobStatus } from "@/platform/api/bob/shared";

export async function startBobDeliverablesImport(): Promise<{
  started?: boolean;
  synced?: number;
  trackerCount?: number;
}> {
  return apiRequest("/api/bob/deliverables/import-airtable", { method: "POST" });
}

export async function getBobDeliverablesImportStatus(): Promise<BobImportJobStatus> {
  return apiRequest<BobImportJobStatus>(
    "/api/bob/deliverables/import-airtable/status",
  );
}
