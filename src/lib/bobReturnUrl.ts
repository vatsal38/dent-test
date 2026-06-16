/**
 * Build returnTo href for attendance / submit flows (not yet URL-encoded).
 */
export function buildBobReturnTo(pathname: string, search: string): string {
  const qs = search.replace(/^\?/, "");
  return qs ? `${pathname}?${qs}` : pathname;
}

export function decodeBobReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/app/")) return null;
    return decoded;
  } catch {
    return null;
  }
}
