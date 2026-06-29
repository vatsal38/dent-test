import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import type { BobAccessContext } from "@/platform/rbac/types";
import {
  resolveStudentTrackLabel,
  rosterTrackLabelMatches,
} from "@/lib/bobRosterTrackOptions";

function trackKeywordsFromPod(pod: BobPod): string[] {
  const keywords = new Set<string>();
  const name = String(pod.name || "").trim();
  if (name) keywords.add(name);
  const display = String(
    (pod as { displayLabel?: string | null }).displayLabel || "",
  ).trim();
  if (display) keywords.add(display);
  const site = String(pod.site || "").trim();
  if (site) keywords.add(site);
  return [...keywords].filter(Boolean);
}

/** Limit attendance workspace to a coach / site supporter's assigned tracks. */
export function filterStudentsByCoachAttendanceScope(
  students: BobStudent[],
  access: BobAccessContext,
  pods: BobPod[],
): BobStudent[] {
  if (access.scopeType === "organization" || !access.isScoped) {
    return students;
  }

  const allowedPodIds = new Set(access.podIds.map(String));
  const assignedPods = pods.filter((p) => allowedPodIds.has(String(p.id)));
  const trackKeywords = assignedPods.flatMap(trackKeywordsFromPod);

  if (!allowedPodIds.size && !trackKeywords.length) return [];

  return students.filter((student) => {
    const podId = student.podId ? String(student.podId) : "";
    if (podId && allowedPodIds.has(podId)) return true;

    const trackLabel = resolveStudentTrackLabel(student);
    if (!trackLabel || trackLabel === "Unassigned") return false;

    return trackKeywords.some(
      (keyword) =>
        rosterTrackLabelMatches(keyword, trackLabel) ||
        rosterTrackLabelMatches(trackLabel, keyword),
    );
  });
}
