import { apiRequest } from "@/platform/api/client";

export type AttendanceCorrectionRequestType =
  | "absence"
  | "time_correction"
  | "special";

export interface AttendanceCorrectionDateOption {
  attendanceId: string;
  airtableRecordId: string;
  date: string;
  /** Four punch slots (preferred); signIn/signOut kept for back-compat */
  morningIn?: string | null;
  morningOut?: string | null;
  afternoonIn?: string | null;
  afternoonOut?: string | null;
  signInTime: string | null;
  signOutTime: string | null;
  attendanceStatus: string | null;
  label: string;
}

export interface AttendanceCorrectionStudentOption {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  email: string | null;
  school: string | null;
  airtableRecordId: string | null;
  attendanceDays: number;
  latestAttendanceDate: string | null;
}

export interface AttendanceCorrectionStudentsResponse {
  students: AttendanceCorrectionStudentOption[];
  total: number;
  hint?: string | null;
}

export interface AttendanceCorrectionOptionsResponse {
  student: {
    id: string;
    name: string;
    airtableRecordId: string | null;
  };
  dates: AttendanceCorrectionDateOption[];
}

export interface SubmitAttendanceCorrectionInput {
  studentId: string;
  requestType: AttendanceCorrectionRequestType;
  attendanceId?: string;
  attendanceAirtableRecordId?: string;
  attendanceDate?: string;
  absenceReason?: string;
  correctedSignInDate?: string;
  correctedSignInTime?: string;
  correctedSignOutDate?: string;
  correctedSignOutTime?: string;
  correctionDetail?: string;
  specialCircumstance?: string;
}

export async function getAttendanceCorrectionStudents(params?: {
  search?: string;
  limit?: number;
}): Promise<AttendanceCorrectionStudentsResponse> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiRequest<AttendanceCorrectionStudentsResponse>(
    `/api/bob/attendance/correction-students${qs ? `?${qs}` : ""}`,
  );
}

export async function getAttendanceCorrectionOptions(
  studentId: string,
): Promise<AttendanceCorrectionOptionsResponse> {
  const sp = new URLSearchParams({ studentId });
  return apiRequest<AttendanceCorrectionOptionsResponse>(
    `/api/bob/attendance/correction-options?${sp}`,
  );
}

export async function submitAttendanceCorrection(
  data: SubmitAttendanceCorrectionInput,
): Promise<{ success: boolean; id: string | null }> {
  return apiRequest("/api/bob/attendance/correction-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
