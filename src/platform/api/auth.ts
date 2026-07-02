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

export interface StudentLoginResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    bobRole: string;
  };
}

export class StudentLoginError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "StudentLoginError";
    this.code = code;
    this.status = status;
  }
}

export async function postStudentLogin(
  email: string,
  password: string,
): Promise<StudentLoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/auth/student-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE}. Start the backend with: cd dent-be && npm run dev`,
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new StudentLoginError(
      (body as { error?: string }).error || "Student login failed",
      (body as { code?: string }).code,
      response.status,
    );
  }
  return body as StudentLoginResponse;
}
