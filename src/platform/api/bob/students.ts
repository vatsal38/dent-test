import { apiRequest } from "@/platform/api/client";
import type { BobImportJobStatus, BobRosterSchemaResponse } from "./shared";

export type { BobRosterSchemaField, BobRosterSchemaResponse } from "./shared";


export const BOB_STUDENT_STATUSES = [
  "active",
  "inactive",
  "graduated",
  "withdrawn",
] as const;
export const BOB_INTERVIEW_STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "placed",
  "not_placed",
] as const;

export type BobStudentStatus = (typeof BOB_STUDENT_STATUSES)[number];
export type BobInterviewStage = (typeof BOB_INTERVIEW_STAGES)[number];

export interface BobStudentAttendanceStats {
  present?: number;
  absent?: number;
  hoursAttended?: number;
  hoursPotential?: number;
  hoursPct?: number;
  hoursPctThisWeek?: number;
  earnedPreTax?: number;
  [key: string]: number | undefined;
}

export interface BobStudentMilestoneStats {
  submitted?: number;
  total?: number;
  completed?: number;
  overdue?: number;
  pctDueSubmitted?: number;
  pctDueCompleted?: number;
  [key: string]: number | undefined;
}

export type BobOnboardingPhase =
  | "signed"
  | "in_progress"
  | "not_started"
  | "unknown"
  | "complete"
  | "incomplete";

export interface BobOnboardingStatus {
  contract: {
    field: string | null;
    label: string | null;
    phase: "signed" | "in_progress" | "not_started" | "unknown";
  };
  ywRegistration: {
    field: string | null;
    label: string | null;
    phase: "complete" | "incomplete" | "unknown";
    presentInYwFinal: boolean;
  };
  preSurvey: {
    field: string | null;
    label: string | null;
    phase: "complete" | "incomplete" | "unknown";
    synced: boolean;
  };
  readyForProgram: boolean;
  contractAndPreSurveyComplete?: boolean;
  contractSigned: boolean;
  ywReady: boolean;
  preSurveyComplete: boolean;
}

export interface BobStaffCoachNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface BobStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: BobStudentStatus;
  interviewStage: BobInterviewStage;
  podId: string | null;
  school?: string | null;
  track?: string | null;
  site?: string | null;
  coach?: string | null;
  stage?: string | null;
  ywStatus?: string | null;
  attendanceStats?: BobStudentAttendanceStats | null;
  milestoneStats?: BobStudentMilestoneStats | null;
  /** Contract / YW registration / pre-survey from synced Airtable fields. */
  onboardingStatus?: BobOnboardingStatus;
  /** Staff coach notes stored in-app (not Airtable linked records). */
  staffCoachNotes?: BobStaffCoachNote[];
  /** Full Airtable row fields from "All Students" (when requested). */
  airtableFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BobStudentsFacetOption {
  value: string;
  count: number;
}

export interface BobStudentsFacetsResponse {
  statuses: BobStudentsFacetOption[];
  interviewStages: BobStudentsFacetOption[];
  schools: BobStudentsFacetOption[];
  grades: BobStudentsFacetOption[];
  tracks: BobStudentsFacetOption[];
  coaches: BobStudentsFacetOption[];
  ywStatuses?: BobStudentsFacetOption[];
  bob26TrackSites?: BobStudentsFacetOption[];
  pipeline: {
    total: number;
    synced: number;
    notSynced: number;
  };
  bobCohort?: { active: number };
  droppedOut?: { count: number };
  onboarding?: { ready: number; incomplete: number; total: number };
}

export interface BobStudentsListParams {
  /** Comma-separated Mongo student ids (max 500) — for pod roster resolution */
  ids?: string;
  status?: BobStudentStatus;
  interviewStage?: BobInterviewStage;
  /** `active` = BoB '26 cohort with track assigned. */
  bobCohort?: "active";
  /** `dropped` = BoB '26 Active Status dropouts + withdrawn. */
  bobActiveStatus?: "dropped";
  /** Filter by onboarding gates (active cohort only). */
  onboardingReady?: "yes" | "no";
  search?: string;
  /** Roster track / program label (from facets — partial match). */
  track?: string;
  /** JSON string: { match, conditions } — Airtable-style filter builder */
  filters?: string;
  sortBy?: "name" | "label";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  includeAirtableFields?: boolean;
  /** When true, attach live attendance + deliverable stats (expensive). Default false on list. */
  includeStats?: boolean;
}

export interface BobStudentsListResponse {
  students: BobStudent[];
  total: number;
  limit: number;
  offset: number;
}

export async function getBobStudents(
  params?: BobStudentsListParams,
): Promise<BobStudentsListResponse> {
  const sp = new URLSearchParams();
  if (params?.ids) sp.set("ids", params.ids);
  if (params?.status) sp.set("status", params.status);
  if (params?.interviewStage) sp.set("interviewStage", params.interviewStage);
  if (params?.bobCohort) sp.set("bobCohort", params.bobCohort);
  if (params?.bobActiveStatus) sp.set("bobActiveStatus", params.bobActiveStatus);
  if (params?.onboardingReady) sp.set("onboardingReady", params.onboardingReady);
  if (params?.search) sp.set("search", params.search);
  if (params?.track) sp.set("track", params.track);
  if (params?.filters) sp.set("filters", params.filters);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.includeAirtableFields) sp.set("includeAirtableFields", "1");
  if (params?.includeStats) sp.set("includeStats", "1");
  const qs = sp.toString();
  return apiRequest<BobStudentsListResponse>(
    `/api/bob/students${qs ? `?${qs}` : ""}`,
  );
}

export async function getBobRosterSchema(): Promise<BobRosterSchemaResponse> {
  return apiRequest<BobRosterSchemaResponse>("/api/bob/roster/schema");
}

export async function getBobStudentsFacets(): Promise<BobStudentsFacetsResponse> {
  return apiRequest<BobStudentsFacetsResponse>("/api/bob/students/facets");
}

export async function getBobStudent(id: string): Promise<BobStudent> {
  return apiRequest<BobStudent>(`/api/bob/students/${id}`);
}

export interface CreateBobStudentInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status?: BobStudentStatus;
  interviewStage?: BobInterviewStage;
  podId?: string | null;
  school?: string | null;
  track?: string | null;
  coach?: string | null;
  stage?: string | null;
  ywStatus?: string | null;
  attendanceStats?: BobStudentAttendanceStats | null;
  milestoneStats?: BobStudentMilestoneStats | null;
  airtableFields?: Record<string, unknown>;
}

export async function createBobStudent(
  data: CreateBobStudentInput,
): Promise<BobStudent> {
  return apiRequest<BobStudent>("/api/bob/students", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBobStudent(
  id: string,
  data: Partial<CreateBobStudentInput>,
): Promise<BobStudent> {
  return apiRequest<BobStudent>(`/api/bob/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function addBobStudentCoachNote(
  id: string,
  body: string,
  author?: string,
): Promise<BobStudent> {
  return apiRequest<BobStudent>(`/api/bob/students/${id}/coach-notes`, {
    method: "POST",
    body: JSON.stringify({ body, author }),
  });
}

export async function deleteBobStudent(id: string): Promise<{ deleted: true }> {
  return apiRequest<{ deleted: true }>(`/api/bob/students/${id}`, {
    method: "DELETE",
  });
}

export async function startBobRosterImport(): Promise<{
  started: boolean;
  startedAt?: string;
  pollPath?: string;
}> {
  return apiRequest("/api/bob/students/import-airtable", { method: "POST" });
}

export async function getBobRosterImportStatus(): Promise<BobImportJobStatus> {
  return apiRequest<BobImportJobStatus>(
    "/api/bob/students/import-airtable/status",
  );
}

/** @deprecated Use startBobRosterImport + poll getBobRosterImportStatus */
export async function importBobStudentsFromAirtable(): Promise<{
  started: boolean;
}> {
  return startBobRosterImport();
}
