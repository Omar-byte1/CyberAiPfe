import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware
 *
 * Purpose: Formally scope the route groups so the landing page ("/")
 * and auth routes ("/login", "/register") are NEVER intercepted by
 * any dashboard-level logic.
 *
 * Note on JWT: The app stores its JWT in localStorage (not cookies),
 * which is inaccessible from Edge middleware. The authoritative auth
 * guard is the client-side <AuthGuard> component in (dashboard)/layout.tsx.
 * This middleware's matcher is the single source of truth for which
 * paths are "protected" from a routing perspective.
 */
export function middleware(request: NextRequest) {
  // Passthrough — auth is enforced client-side by AuthGuard.
  // This file exists to lock the matcher so Next.js never applies
  // dashboard segment logic to landing / auth routes.
  return NextResponse.next();
}

export const config = {
  /**
   * Only match dashboard paths.
   * - Landing "/"          → NOT matched (public)
   * - "/login"             → NOT matched (public)
   * - "/register"          → NOT matched (public)
   * - "/dashboard"         → matched  (protected by AuthGuard)
   * - "/dashboard/..."     → matched  (protected by AuthGuard)
   */
  matcher: ['/dashboard/:path*'],
};
