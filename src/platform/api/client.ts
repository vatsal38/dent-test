import { auth } from "@/lib/firebase";
import { getStoredDemoToken } from "@/lib/demoAuth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function isNetworkFetchError(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    (err.message === "Failed to fetch" ||
      err.message.includes("NetworkError") ||
      err.message.includes("Load failed"))
  );
}

export function apiUnreachableMessage(): string {
  return `Cannot reach the API at ${API_BASE}. Start the backend with: cd dent-be && npm run dev`;
}

export async function getIdToken(): Promise<string | null> {
  const demoToken = getStoredDemoToken();
  if (demoToken) return demoToken;
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getIdToken();

  if (!token) {
    throw new Error("Not authenticated. Please sign in.");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (err) {
    if (isNetworkFetchError(err)) throw new Error(apiUnreachableMessage());
    throw err;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(
      (error as { error?: string; message?: string }).error ||
        (error as { message?: string }).message ||
        `API error: ${response.status}`,
    ) as Error & { status?: number; code?: string; details?: unknown };
    err.status = response.status;
    if ((error as { code?: string }).code) err.code = (error as { code: string }).code;
    if ((error as { details?: unknown }).details)
      err.details = (error as { details: unknown }).details;
    throw err;
  }

  return response.json();
}
