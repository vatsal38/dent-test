import { apiRequest } from "@/platform/api/client";

export type BobOnboardingTaskStatus = "pending" | "done" | "skipped";

export interface BobOnboardingTask {
  id: string;
  studentId: string;
  taskKey: string;
  title: string;
  status: BobOnboardingTaskStatus;
  recruitmentRecordId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BobStudentOnboardingTasksResponse {
  tasks: BobOnboardingTask[];
}

export async function getBobStudentOnboardingTasks(
  studentId: string,
): Promise<BobStudentOnboardingTasksResponse> {
  return apiRequest<BobStudentOnboardingTasksResponse>(
    `/api/bob/students/${encodeURIComponent(studentId)}/onboarding-tasks`,
  );
}
