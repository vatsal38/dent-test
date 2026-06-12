import { API_BASE } from "@/platform/api/client";

export type DemoLoginRole =
  | "admin"
  | "site_supporter"
  | "coach"
  | "student";

export interface DemoLoginResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    bobRole: string;
    demoScope?: Record<string, unknown> | null;
  };
}

export async function postDemoLogin(
  role: DemoLoginRole,
): Promise<DemoLoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE}. Start the backend with: cd dent-be && npm run dev`,
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: string }).error || "Demo login failed",
    );
  }
  return response.json();
}
