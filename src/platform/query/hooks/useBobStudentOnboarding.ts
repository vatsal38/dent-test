"use client";

import { useQuery } from "@tanstack/react-query";
import { getBobStudentOnboardingTasks } from "@/platform/api/bob/onboarding";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobStudentOnboardingTasks(
  studentId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: bobKeys.students.onboarding(studentId ?? ""),
    queryFn: () => getBobStudentOnboardingTasks(studentId!),
    enabled: Boolean(studentId) && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}
