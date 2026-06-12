const DEMO_TOKEN_KEY = "dent_demo_token";

export function getStoredDemoToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(DEMO_TOKEN_KEY);
}

export function setStoredDemoToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(DEMO_TOKEN_KEY, token);
  else sessionStorage.removeItem(DEMO_TOKEN_KEY);
}

export function isDemoModeEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === "true";
}
