import type { BobPod } from "@/platform/api/bob/pods";

export interface PodUserIdentity {
  id: string;
  email: string;
  name: string;
  firebaseUid?: string | null;
}

/** Match pods where the signed-in user is coach or site supporter. */
export function matchPodsForUser(
  pods: BobPod[],
  user: PodUserIdentity | null | undefined,
): BobPod[] {
  if (!user) return [];
  const keys = new Set<string>();
  const add = (v: string | null | undefined) => {
    const s = String(v || "").trim().toLowerCase();
    if (s) keys.add(s);
  };
  add(user.id);
  add(user.email);
  add(user.name);
  add(user.firebaseUid);

  return pods.filter((p) => {
    add(p.coachId);
    add(p.siteSupporterId);
    const coach = String(p.coachId || "").trim().toLowerCase();
    const site = String(p.siteSupporterId || "").trim().toLowerCase();
    for (const k of keys) {
      if (k && (coach === k || site === k)) return true;
    }
    return false;
  });
}

export function pickPrimaryPod(
  pods: BobPod[],
  user: PodUserIdentity | null | undefined,
): BobPod | null {
  const matched = matchPodsForUser(pods, user);
  if (matched.length === 0) return null;
  const uid = String(user?.id || "").trim().toLowerCase();
  const byCoach = matched.find(
    (p) => String(p.coachId || "").trim().toLowerCase() === uid,
  );
  return byCoach ?? matched[0];
}
