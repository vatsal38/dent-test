import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import { studentDisplayName } from "@/features/bob/roster/recordDisplay";
import { UNASSIGNED_POD_ID } from "./buildAttendanceIndex";

/** Never surface raw Mongo ids in UI copy. */
export function resolveStudentName(
  studentId: string,
  studentById: Map<string, BobStudent>,
): string {
  const s = studentById.get(studentId);
  return s ? studentDisplayName(s) : "Unknown student";
}

export function resolvePodName(
  podId: string,
  podById: Map<string, BobPod>,
): string {
  if (podId === UNASSIGNED_POD_ID) return "No pod assigned";
  const p = podById.get(podId);
  return p?.name ?? "Unknown pod";
}

export function resolveSiteName(
  podId: string,
  podById: Map<string, BobPod>,
): string | undefined {
  const p = podById.get(podId);
  const site = p?.site?.trim();
  return site || undefined;
}
