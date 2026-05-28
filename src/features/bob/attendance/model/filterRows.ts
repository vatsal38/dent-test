import { resolveStudentName } from "./resolveDisplay";
import type { BobStudent } from "@/platform/api/bob/students";

export function studentMatchesSearch(
  studentId: string,
  studentById: Map<string, BobStudent>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const s = studentById.get(studentId);
  if (!s) return false;
  const name = resolveStudentName(studentId, studentById).toLowerCase();
  const email = (s.email || "").toLowerCase();
  const school = (s.school || "").toLowerCase();
  return name.includes(q) || email.includes(q) || school.includes(q);
}
