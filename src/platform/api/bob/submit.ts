import { API_BASE, getIdToken, isNetworkFetchError, apiUnreachableMessage } from "@/platform/api/client";

export interface BlitzTeamOption {
  value: string;
  label: string;
  kind: "color" | "squad" | "track";
  blitzScope?: "global" | "track";
  blitzColor?: string | null;
  blitzTrack?: string | null;
}

export interface BlitzCategoryOption {
  id: string;
  label: string;
  defaultPoints: number;
  fixedPoints: boolean;
  weeklyCap: number | null;
}

export interface BlitzTeamOptionsResponse {
  colors: BlitzTeamOption[];
  squads: BlitzTeamOption[];
  globalTeams: BlitzTeamOption[];
  trackTeams: BlitzTeamOption[];
  categories: BlitzCategoryOption[];
  coachingWeeklyCap: number;
  options: BlitzTeamOption[];
}

export interface BobOneStopAttachment {
  filename: string;
  mimeType: string;
  content: string;
}

export type BobOneStopPayload = Record<string, string | boolean | string[] | BobOneStopAttachment[] | undefined>;

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
  payload: BobOneStopPayload,
): Promise<{ success: boolean; id?: string }> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/bob/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type, ...payload }),
    });
  } catch (err) {
    if (isNetworkFetchError(err)) {
      throw new Error(apiUnreachableMessage());
    }
    throw err;
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string })?.error || res.statusText || "Submit failed",
    );
  }
  return res.json();
}
