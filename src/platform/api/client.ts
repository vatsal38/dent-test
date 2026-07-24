import { auth } from "@/lib/firebase";
import { getStoredDemoToken } from "@/lib/demoAuth";

/** Backend URL from env (used for SSR and when same-origin proxy is disabled). */
export const CONFIGURED_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** @deprecated use getApiBase() — in the browser this may be "" (same-origin proxy). */
export const API_BASE = CONFIGURED_API_BASE;

/**
 * In the browser, call the Next.js `/api` rewrite (same origin) to avoid
 * cross-origin failures on mobile and strict networks. Server-side keeps the
 * configured backend URL.
 */
export function getApiBase(): string {
  if (typeof window === "undefined") {
    return CONFIGURED_API_BASE;
  }
  if (process.env.NEXT_PUBLIC_API_SAME_ORIGIN === "false") {
    return CONFIGURED_API_BASE;
  }
  return "";
}

export function isNetworkFetchError(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    (err.message === "Failed to fetch" ||
      err.message.includes("NetworkError") ||
      err.message.includes("Load failed"))
  );
}

export function apiUnreachableMessage(): string {
  const inBrowser = typeof window !== "undefined";
  const usingProxy = inBrowser && getApiBase() === "";
  const target = usingProxy
    ? `${window.location.origin}/api`
    : CONFIGURED_API_BASE;

  if (process.env.NODE_ENV === "production") {
    return `Cannot reach the server right now. Check your connection and try again. If this keeps happening, contact support. (${target})`;
  }
  return `Cannot reach the API at ${target}. Start the backend with: cd dent-be && npm run dev`;
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

  const base = getApiBase();
  let response: Response;
  try {
    response = await fetch(`${base}${endpoint}`, {
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
