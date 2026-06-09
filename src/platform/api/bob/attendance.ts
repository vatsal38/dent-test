import { apiRequest } from "@/platform/api/client";


export const BOB_ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "excused",
  "late",
] as const;
export type BobAttendanceStatus = (typeof BOB_ATTENDANCE_STATUSES)[number];

export interface BobAttendance {
  id: string;
  studentId: string | null;
  date: string;
  podId?: string | null;
  status?: BobAttendanceStatus;
  /** Airtable punch event — maps to session slots */
  signType?: string | null;
  signInTime?: string | null;
  signOutTime?: string | null;
  rawSignInTime?: string | null;
  rawSignOutTime?: string | null;
  adjustedSignIn?: string | null;
  adjustedSignOut?: string | null;
  /** Airtable formula fields — display only */
  attendanceStatus?: string | null;
  attendanceStatusHours?: string | null;
  hoursPresent?: string | null;
  amHours?: string | null;
  pmHours?: string | null;
  maxHours?: string | null;
  totalHours?: string | null;
  excusedAbsence?: boolean;
  manualStartTime?: string | null;
  manualEndTime?: string | null;
  manualOverride?: string | null;
  staffCorrectionSignIn?: string | null;
  staffCorrectionSignOut?: string | null;
  branch?: string | null;
  program?: string | null;
  track?: string | null;
  personName?: string | null;
  airtableRecordId?: string | null;
  studentAirtableRecordId?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BobAttendanceListParams {
  podId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface BobAttendanceListResponse {
  attendance: BobAttendance[];
  total: number;
  limit: number;
  offset: number;
}

export interface BobAttendanceDateBounds {
  earliestDate: string | null;
  latestDate: string | null;
  total: number;
}

export async function getBobAttendanceDateBounds(): Promise<BobAttendanceDateBounds> {
  return apiRequest<BobAttendanceDateBounds>("/api/bob/attendance/date-bounds");
}

export async function getBobAttendance(
  params?: BobAttendanceListParams,
): Promise<BobAttendanceListResponse> {
  const sp = new URLSearchParams();
  if (params?.podId) sp.set("podId", params.podId);
  if (params?.studentId) sp.set("studentId", params.studentId);
  if (params?.date) sp.set("date", params.date);
  if (params?.startDate) sp.set("startDate", params.startDate);
  if (params?.endDate) sp.set("endDate", params.endDate);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return apiRequest<BobAttendanceListResponse>(
    `/api/bob/attendance${qs ? `?${qs}` : ""}`,
  );
}

export async function getBobAttendanceRecord(
  id: string,
): Promise<BobAttendance> {
  return apiRequest<BobAttendance>(`/api/bob/attendance/${id}`);
}

export interface CreateBobAttendanceInput {
  studentId: string;
  date: string;
  podId: string;
  status?: BobAttendanceStatus;
}

export async function createBobAttendance(
  data: CreateBobAttendanceInput,
): Promise<BobAttendance> {
  return apiRequest<BobAttendance>("/api/bob/attendance", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBobAttendance(
  id: string,
  data: { status: BobAttendanceStatus },
): Promise<BobAttendance> {
  return apiRequest<BobAttendance>(`/api/bob/attendance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
