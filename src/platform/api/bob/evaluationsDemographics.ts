import { apiRequest } from "@/platform/api/client";
import type { BobImportJobStatus } from "@/platform/api/bob/shared";

export interface EvaluationsDemographicsSyncResult {
  ok?: boolean;
  skipped?: boolean;
  reason?: string;
  evaluationRecordId?: string;
  studentsAlumsRecordId?: string;
  email?: string;
  mongoStudentId?: string | null;
  fieldsWritten?: string[];
  partial?: boolean;
  fieldFailures?: Array<{ field: string; error: string }>;
  message?: string;
  error?: string;
}

export interface EvaluationsDemographicsSyncResponse {
  scanned: number;
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  results: EvaluationsDemographicsSyncResult[];
}

export async function startEvaluationsDemographicsSync(params?: {
  sinceHours?: number;
  limit?: number;
  /** Re-apply demographics even when a prior sync recorded the evaluation row. */
  force?: boolean;
}): Promise<{
  started: boolean;
  startedAt?: string;
  pollPath?: string;
}> {
  return apiRequest("/api/bob/evaluations/demographics/sync", {
    method: "POST",
    body: JSON.stringify({
      sinceHours: params?.sinceHours ?? 168,
      limit: params?.limit ?? 100,
      force: params?.force ?? true,
    }),
  });
}

export async function getEvaluationsDemographicsSyncStatus(): Promise<BobImportJobStatus> {
  return apiRequest("/api/bob/evaluations/demographics/sync/status");
}

/** @deprecated Use startEvaluationsDemographicsSync + poll status */
export async function syncEvaluationsDemographics(params?: {
  sinceHours?: number;
  limit?: number;
}): Promise<EvaluationsDemographicsSyncResponse> {
  return apiRequest("/api/bob/evaluations/demographics/sync?wait=true", {
    method: "POST",
    body: JSON.stringify({
      sinceHours: params?.sinceHours ?? 72,
      limit: params?.limit ?? 15,
    }),
  });
}
