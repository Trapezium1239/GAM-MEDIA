import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security':
    'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: *.cloudinary.com *.supabase.co *.googleusercontent.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.cloudinary.com blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Aggressive caching headers for public read endpoints.
 * Uses stale-while-revalidate for sub-100ms PWA shell on bad networks.
 */
export function addPublicCachingHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300, stale-if-error=600');
  return response;
}

/**
 * Private no-store headers for user-scoped sensitive endpoints.
 * Prevents any caching of PII, auth tokens, or profile data.
 */
export function addPrivateNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

/**
 * Long-lived caching for static assets served by the PWA.
 */
export function addStaticCachingHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable, stale-while-revalidate=86400');
  return response;
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return 'Internal server error';
  }
  return 'Internal server error';
}

/**
 * Validate that a redirect URL is relative (not open redirect).
 * Only allows same-origin paths.
 */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');
    return parsed.origin === 'http://localhost' || parsed.origin === 'null';
  } catch {
    return false;
  }
}