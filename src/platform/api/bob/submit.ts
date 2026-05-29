import { API_BASE } from "@/platform/api/client";

export interface BlitzTeamOption {
  value: string;
  label: string;
  kind: "color" | "squad";
}

export interface BlitzTeamOptionsResponse {
  colors: BlitzTeamOption[];
  squads: BlitzTeamOption[];
  options: BlitzTeamOption[];
}

export async function getBlitzTeamOptions(): Promise<BlitzTeamOptionsResponse> {
  const res = await fetch(`${API_BASE}/api/bob/submit/blitz-teams`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string })?.error || "Failed to load blitz teams",
    );
  }
  return res.json() as Promise<BlitzTeamOptionsResponse>;
}

export async function submitBobOneStop(
  type: string,
  payload: Record<string, string>,
): Promise<{ success: boolean; id?: string }> {
  const res = await fetch(`${API_BASE}/api/bob/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...payload }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string })?.error || res.statusText || "Submit failed",
    );
  }
  return res.json();
}
