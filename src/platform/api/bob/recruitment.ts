import { apiRequest } from "@/platform/api/client";
import type { BobImportJobStatus, BobRosterSchemaResponse } from "./shared";

export interface BobRecruitmentRecord {
  id: string;
  label: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  recruitmentStatus?: string | null;
  counselor?: string | null;
  /** Youth Apps & Intake Airtable record id */
  airtableRecordId?: string | null;
  /** Students & Alums row after transfer */
  studentsAlumsAirtableRecordId?: string | null;
  studentsAlumsFields?: Record<string, unknown>;
  programRecordIds?: string[];
  transferredAt?: string | null;
  studentsAlumsSyncState?: string | null;
  transferDuplicateResolution?: string | null;
  rosterStudentId?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  airtableFields?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type BobRecruitmentTriState = "yes" | "no";

export interface BobRecruitmentFilterGroupPayload {
  match?: "and" | "or";
  conditions?: Array<{
    field: string;
    operator: string;
    value?: string;
  }>;
}

export interface BobRecruitmentListParams {
  search?: string;
  /** JSON string: { match, conditions } — Airtable-style filter builder */
  filters?: string;
  status?: string;
  ywStatus?: string;
  transferred?: BobRecruitmentTriState;
  onRoster?: BobRecruitmentTriState;
  hasPrograms?: BobRecruitmentTriState;
  synced?: BobRecruitmentTriState;
  school?: string;
  grade?: string;
  assignedTo?: string;
  sortBy?: "label" | "name";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface BobRecruitmentFacetOption {
  value: string;
  count: number;
}

export interface BobRecruitmentFacetsResponse {
  appStatuses: BobRecruitmentFacetOption[];
  ywStatuses: BobRecruitmentFacetOption[];
  schools: BobRecruitmentFacetOption[];
  grades: BobRecruitmentFacetOption[];
  assignedTo: BobRecruitmentFacetOption[];
  pipeline: {
    total: number;
    transferred: number;
    notTransferred: number;
    onRoster: number;
    notOnRoster: number;
    withPrograms: number;
    withoutPrograms: number;
    synced: number;
    notSynced: number;
  };
}

export interface BobRecruitmentListResponse {
  records: BobRecruitmentRecord[];
  total: number;
  limit: number;
  offset: number;
}

export async function getBobRecruitmentSchema(): Promise<BobRosterSchemaResponse> {
  return apiRequest<BobRosterSchemaResponse>("/api/bob/recruitment/schema");
}

export async function getBobRecruitmentList(
  params?: BobRecruitmentListParams,
): Promise<BobRecruitmentListResponse> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.filters) sp.set("filters", params.filters);
  if (params?.status) sp.set("status", params.status);
  if (params?.ywStatus) sp.set("ywStatus", params.ywStatus);
  if (params?.transferred) sp.set("transferred", params.transferred);
  if (params?.onRoster) sp.set("onRoster", params.onRoster);
  if (params?.hasPrograms) sp.set("hasPrograms", params.hasPrograms);
  if (params?.synced) sp.set("synced", params.synced);
  if (params?.school) sp.set("school", params.school);
  if (params?.grade) sp.set("grade", params.grade);
  if (params?.assignedTo) sp.set("assignedTo", params.assignedTo);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return apiRequest<BobRecruitmentListResponse>(
    `/api/bob/recruitment${qs ? `?${qs}` : ""}`,
  );
}

export async function getBobRecruitmentFacets(): Promise<BobRecruitmentFacetsResponse> {
  return apiRequest<BobRecruitmentFacetsResponse>(
    "/api/bob/recruitment/facets",
  );
}

export async function getBobRecruitmentRecord(
  id: string,
): Promise<BobRecruitmentRecord> {
  return apiRequest<BobRecruitmentRecord>(`/api/bob/recruitment/${id}`);
}

export interface CreateBobRecruitmentInput {
  label: string;
  name?: string;
  airtableFields?: Record<string, unknown>;
}

export async function createBobRecruitment(
  data: CreateBobRecruitmentInput,
): Promise<BobRecruitmentRecord> {
  return apiRequest<BobRecruitmentRecord>("/api/bob/recruitment", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approveBobRecruitment(
  id: string,
): Promise<BobRecruitmentRecord> {
  return apiRequest<BobRecruitmentRecord>(
    `/api/bob/recruitment/${id}/approve`,
    {
      method: "POST",
    },
  );
}

export interface BobTransferValidationIssue {
  code: string;
  message: string;
}

export interface BobRecruitmentTransferPreview {
  valid: boolean;
  errors: BobTransferValidationIssue[];
  warnings: BobTransferValidationIssue[];
  checks: Record<string, unknown>;
  action: "create" | "update";
  duplicate?: {
    source: string;
    matchType: string;
    studentsAlumsAirtableRecordId: string;
    label?: string | null;
    resolution?: string;
  } | null;
  duplicateCandidates?: Array<Record<string, unknown>>;
  programRecordIds: string[];
  programLabels: Record<string, string>;
  proposedFieldKeys?: string[];
  intakeSync?: { syncState?: string; exists?: boolean | null };
  alreadyTransferred?: boolean;
  studentsAlumsSyncState?: string | null;
}

export interface BobRecruitmentTransferResult {
  studentsAlumsAirtableRecordId: string;
  studentsAlumsFields?: Record<string, unknown>;
  programRecordIds?: string[];
  alreadyTransferred?: boolean;
  action?: string;
  duplicateResolution?: string | null;
  warnings?: BobTransferValidationIssue[];
  syncState?: string;
}

export async function previewBobRecruitmentTransfer(
  id: string,
  options?: { programRecordIds?: string[] },
): Promise<BobRecruitmentTransferPreview> {
  return apiRequest<BobRecruitmentTransferPreview>(
    `/api/bob/recruitment/${id}/transfer-preview`,
    {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    },
  );
}

export async function transferBobRecruitment(
  id: string,
  options?: { programRecordIds?: string[] },
): Promise<BobRecruitmentTransferResult> {
  return apiRequest<BobRecruitmentTransferResult>(
    `/api/bob/recruitment/${id}/transfer`,
    {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    },
  );
}

export async function updateBobRecruitmentPrograms(
  id: string,
  programRecordIds: string[],
): Promise<BobRecruitmentRecord> {
  return apiRequest<BobRecruitmentRecord>(
    `/api/bob/recruitment/${id}/programs`,
    {
      method: "PATCH",
      body: JSON.stringify({ programRecordIds }),
    },
  );
}

export async function resetBobPipeline(): Promise<{
  success: boolean;
  deleted: Record<string, number>;
}> {
  return apiRequest("/api/bob/pipeline/reset", {
    method: "POST",
    body: JSON.stringify({ confirm: "RESET_PIPELINE" }),
  });
}

export async function updateBobRecruitment(
  id: string,
  data: Partial<
    Pick<BobRecruitmentRecord, "label" | "airtableFields" | "recruitmentStatus">
  >,
): Promise<BobRecruitmentRecord> {
  return apiRequest<BobRecruitmentRecord>(`/api/bob/recruitment/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBobRecruitment(
  id: string,
): Promise<{ deleted: true }> {
  return apiRequest<{ deleted: true }>(`/api/bob/recruitment/${id}`, {
    method: "DELETE",
  });
}

export async function startBobRecruitmentImport(): Promise<{
  started: boolean;
  startedAt?: string;
  pollPath?: string;
}> {
  return apiRequest("/api/bob/recruitment/import-airtable", { method: "POST" });
}

export async function getBobRecruitmentImportStatus(): Promise<BobImportJobStatus> {
  return apiRequest<BobImportJobStatus>(
    "/api/bob/recruitment/import-airtable/status",
  );
}

/** @deprecated Use startBobRecruitmentImport + poll getBobRecruitmentImportStatus */
export async function importBobRecruitmentFromAirtable(): Promise<{
  started: boolean;
}> {
  return startBobRecruitmentImport();
}
