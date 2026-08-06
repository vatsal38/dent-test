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
  const combined = `${name} ${display} ${site}`;
  if (/accelerate\s*your\s*dent|\bayd\b/i.test(combined)) {
    keywords.add("Accelerate Your Dent (AYD)");
    keywords.add("AYD");
  }
  if (/denternship/i.test(combined)) keywords.add("Denternship");
  if (/made@?\s*dent/i.test(combined)) keywords.add("Made@Dent");
  if (/content\s*creation|nextgen/i.test(combined)) {
    keywords.add("Content Creation & Marketing");
  }
  return [...keywords].filter(Boolean);
}

/** Limit attendance workspace to a coach / site supporter's assigned tracks. */
export function filterStudentsByCoachAttendanceScope(
  students: BobStudent[],
  access: BobAccessContext,
  pods: BobPod[],
  assignedPods?: { id: string; name: string; site?: string | null }[],
): BobStudent[] {
  if (access.scopeType === "organization" || !access.isScoped) {
    return students;
  }

  const allowedPodIds = new Set(access.podIds.map(String));
  let assignedPodsList = pods.filter((p) => allowedPodIds.has(String(p.id)));
  if (!assignedPodsList.length && assignedPods?.length) {
    assignedPodsList = assignedPods.map((p) => ({
      id: p.id,
      name: p.name,
      site: p.site ?? null,
    })) as BobPod[];
  }
  const trackKeywords = assignedPodsList.flatMap(trackKeywordsFromPod);

  if (!allowedPodIds.size && !trackKeywords.length) return students;

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
