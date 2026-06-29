import { resolvePodName, resolveStudentName } from "./resolveDisplay";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import type { StudentDayAttendance } from "../types";

function fieldText(value: unknown): string {
  if (value == null) return "";
  return String(value).toLowerCase();
}

export function studentMatchesSearch(
  studentId: string,
  studentById: Map<string, BobStudent>,
  podById: Map<string, BobPod>,
  day: StudentDayAttendance | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const s = studentById.get(studentId);
  if (!s) return false;
  const name = resolveStudentName(studentId, studentById).toLowerCase();
  const preferred = String(
    s.preferredName ||
      (s.airtableFields?.["Preferred Name"] as string | undefined) ||
      "",
  ).toLowerCase();
  const email = (s.email || "").toLowerCase();
  const school = (s.school || "").toLowerCase();
  const track = (s.track || day?.track || "").toLowerCase();
  const podName = resolvePodName(
    day?.podId || s.podId || "",
    podById,
    s,
  ).toLowerCase();
  const site = (s.site || day?.site || day?.branch || "").toLowerCase();
  const program = (day?.program || "").toLowerCase();
  const studentIdText = studentId.toLowerCase();
  const decId =
    fieldText(s.airtableFields?.["DEC ID"]) ||
    fieldText(s.airtableFields?.["DEC ID (from Your Name)"]) ||
    fieldText(s.airtableFields?.["Student ID"]);

  return (
    name.includes(q) ||
    preferred.includes(q) ||
    email.includes(q) ||
    school.includes(q) ||
    track.includes(q) ||
    podName.includes(q) ||
    site.includes(q) ||
    program.includes(q) ||
    studentIdText.includes(q) ||
    decId.includes(q)
  );
}
