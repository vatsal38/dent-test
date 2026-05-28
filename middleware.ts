import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware for BoB routes.
 *
 * Dent Ops uses Firebase Bearer tokens (client `apiRequest`), not session cookies,
 * so fine-grained RBAC runs in {@link BobRouteGuard} after `GET /api/bob/me`.
 *
 * This layer can add security headers or future cookie-based SSO checks.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/app/bob")) {
    response.headers.set("x-bob-app", "1");
  }

  return response;
}

export const config = {
  matcher: ["/app/bob/:path*"],
};
