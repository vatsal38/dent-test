import type { BobStaffMember } from "@/platform/api/bob/staff";

export function staffDisplayName(m: BobStaffMember): string {
  const name = (m.name || "").trim();
  if (name && m.email) return `${name} (${m.email})`;
  return name || m.email || m.assignableRef;
}

/** Resolve pod coachId / siteSupporterId to a human label. */
export function resolveStaffLabel(
  staff: BobStaffMember[],
  ref: string | null | undefined,
): string {
  const key = (ref || "").trim();
  if (!key) return "—";
  const hit = staff.find(
    (s) =>
      s.assignableRef === key ||
      s.id === key ||
      s.email === key ||
      (s.name || "").trim() === key,
  );
  if (hit) return staffDisplayName(hit);
  if (key.includes("@")) return key;
  return "Unassigned user";
}

/** All coach refs for a track (up to two from Airtable Staff links). */
export function podCoachIds(pod: {
  coachIds?: string[];
  coachId?: string | null;
}): string[] {
  const fromArray = (pod.coachIds || []).map((id) => String(id).trim()).filter(Boolean);
  if (fromArray.length) return fromArray;
  const single = (pod.coachId || "").trim();
  return single ? [single] : [];
}

export function resolveStaffLabels(
  staff: BobStaffMember[],
  refs: string[],
): string {
  const labels = refs.map((ref) => resolveStaffLabel(staff, ref)).filter((l) => l !== "—");
  return labels.length ? labels.join(", ") : "—";
}

export function staffForRole(
  staff: BobStaffMember[],
  role: "coach" | "site_supporter",
): BobStaffMember[] {
  return staff.filter((s) => {
    const r = (s.bobRole || "").toLowerCase();
    if (role === "coach") {
      return r === "coach" || r === "site_coach";
    }
    return r === "site_supporter" || r === "site supporter";
  });
}
